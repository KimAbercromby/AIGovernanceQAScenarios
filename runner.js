/* Runs one scenario against the triage engine and returns every check made.
 * Works in the browser (window.QARunner) and in Node (require). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.QARunner = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const GATE_LETTER = { Required: "R", "Not applicable": "N", Conditional: "C" };

  function routeOf(L, p, r) {
    if (L.isActionCapable(p, r.triggerIds)) return "agentic";
    if (L.isFoundInUse(p)) return "retrospective";
    if (L.isReentry(p)) return "re-entry";
    if (L.isLightTouch(p, r)) return "light";
    return "standard";
  }

  function build(L, QA, s) {
    const profile = { ...QA.BASE, ...(s.p || {}) };
    Object.keys(profile).forEach((k) => profile[k] === undefined && delete profile[k]);
    const [imp, likelihood] = QA.RISK[s.risk || "LOW"];
    const results = L.calculateTriage({
      profile,
      agpiScores: s.agpi || QA.AGPI_LOW,
      impactScores: { residentImpact: imp[0], legalImpact: imp[1], reputationImpact: imp[2], operationalImpact: imp[3], financialImpact: imp[4] },
      likelihood,
      control: s.control || 2,
      controlEvidence: s.evidence || "Not evidenced — planned or unverified",
      controlEvidenceRef: s.evidenceRef || "",
      verificationRef: "",
      triggerIds: s.triggers || [],
      agentic: null,
      governanceInvestigation: s.investigation || "No",
    });
    const route = L.buildRoute(profile, results, {});
    return { profile, results, route };
  }

  // Agent Record level (suite v3.9.9; Playbook F.3): agency scenarios run the agentic
  // assessment only, with containment demonstrated so rule D1 does not apply.
  function runAgency(L, s) {
    const e = s.expect || {};
    const checks = [];
    const add = (label, expected, actual, pass) => checks.push({ label, expected: String(expected), actual: String(actual), pass: !!pass });
    let a, rec;
    try {
      a = L.computeAgentic({ dimensions: s.agency.dims || {}, multipliers: s.agency.mult || [], killSwitch: true, rollback: true, boundariesTested: true });
      rec = s.agency.unassessed ? L.agentRecordLevel(null) : a.recordLevel;
    } catch (err) { return { pass: false, error: String(err && err.message || err), checks: [] }; }
    if (e.agencyTier) add("Agency tier", e.agencyTier, a.tierLabel, a.tierLabel.startsWith(e.agencyTier));
    if (e.recordLevel) add("Agent Record level", e.recordLevel, rec.level, rec.level === e.recordLevel);
    (e.sheets || []).forEach((sh) => add("Sheet required", sh, rec.sheets.join(", ") || "none", rec.sheets.includes(sh)));
    if (e.noSheets) add("Extra sheets", "none", rec.sheets.join(", ") || "none", rec.sheets.length === 0);
    return { pass: checks.length > 0 && checks.every((c) => c.pass), checks, summary: { tier: a.tierLabel, route: rec.level, gates: "", priority: "" } };
  }

  function run(L, QA, s) {
    if (s.kind !== "engine") return null;
    if (s.agency) return runAgency(L, s);
    let ctx;
    try { ctx = build(L, QA, s); } catch (e) { return { pass: false, error: String(e && e.message || e), checks: [] }; }
    const { profile, results, route } = ctx;
    const e = s.expect || {};
    const checks = [];
    const add = (label, expected, actual, pass) => checks.push({ label, expected: String(expected), actual: String(actual), pass: !!pass });
    const gates = route.filter((g) => g.gate).map((g) => GATE_LETTER[g.applicability] || "?").join("");
    const light = L.isLightTouch(profile, results);
    const routeName = routeOf(L, profile, results);

    if (e.tier) add("Governing tier", e.tier, results.effectiveTierName, results.effectiveTierName === e.tier);
    if (e.route) add("Route", e.route, routeName, routeName === e.route);
    if (e.light !== undefined) add("Light-touch", e.light ? "Yes" : "No", light ? "Yes" : "No", light === e.light);
    if (e.gates) add("Gates 1 to 6", e.gates, gates, gates === e.gates);
    if (e.priority) add("Priority", e.priority.source.replace(/[\^\\]/g, ""), results.priority.label, e.priority.test(results.priority.label));
    if (e.priorityAtMost) {
      const n = Number((/Priority (\d)/.exec(results.effectiveGovernancePriority || results.priority.label) || [])[1]);
      add("Priority (urgency)", `${e.priorityAtMost} or higher`, results.effectiveGovernancePriority || results.priority.label, n && n <= e.priorityAtMost);
    }
    if (e.conflict) {
      const c = L.fastTrackConflicts(profile).join("; ");
      add("Fast-Track contradiction flagged", e.conflict.source, c || "none", e.conflict.test(c));
    }
    if (e.answerWarn) {
      const w = (L.answerConflicts ? L.answerConflicts(profile, results) : []).join(" ");
      add("Contradiction warning shown", e.answerWarn.source, w || "none", e.answerWarn.test(w));
    }
    if (e.block) {
      const b = L.lightTouchBlockReason(profile, results);
      add("Reason shown for no Light-touch", e.block.source, b || "none", e.block.test(b));
    }
    const carried = (g) => (route.find((x) => x.gateNumber === g) || { evidence: [] }).evidence.some((x) => /screening outcome \(may be by reference/.test(x));
    if (e.g6carries) add("Gate 6 receives the screening outcome", "Yes", carried(6) ? "Yes" : "No", carried(6));
    if (e.g5carries) {
      add("Gate 5 receives the screening outcome", "Yes", carried(5) ? "Yes" : "No", carried(5));
      add("Gate 6 does not duplicate it", "No", carried(6) ? "Yes" : "No", !carried(6));
    }
    if (e.planUcBlank || e.planJBlank || e.columnM) {
      const csv = L.buildGatePlanCsv(profile, route, results).replace(/^﻿/, "").trim().split("\r\n").map((l) => l.slice(1, -1).split('","'));
      const rows = csv.slice(1);
      if (e.planUcBlank) add("Gate plan UC-ID column", "blank (steward adds it)", rows.every((r) => r[10] === "") ? "blank" : "filled", rows.every((r) => r[10] === ""));
      if (e.planJBlank) add("N/A rationale column J", "left for the steward", rows.every((r) => r[9] === "") ? "blank" : "pre-filled", rows.every((r) => r[9] === ""));
      if (e.columnM) add("Column M header", "warns: paste A to L only", csv[0][12], /paste columns A to L only/.test(csv[0][12]));
    }
    return { pass: checks.length > 0 && checks.every((c) => c.pass), checks, summary: { tier: results.effectiveTierName, route: routeName, gates, priority: results.priority.label } };
  }

  return { run, routeOf, build };
});

#!/usr/bin/env node
"use strict";
// Mutation check: proves the scenarios would catch real mistakes.
// Each mutation re-introduces a plausible bug into a copy of the engine (in memory,
// never on disk) and re-runs every engine scenario. A mutation is "caught" when at
// least one scenario fails. Writes results/mutation-results.json and .js.
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const QA = require("../scenarios.js");
const R = require("../runner.js");
const SRC = fs.readFileSync(path.join(__dirname, "..", "engine", "triage-logic.js"), "utf8");

const MUTATIONS = [
  { id: "M1", name: "Light-touch ignores the Fast-Track answers", note: "The defect found in the Copilot simulation on 3 October 2026.",
    from: "return lowTierCandidate(profile, results) && fastTrackOf(profile) === FAST_TRACK.allNo &&\n      !fastTrackConflicts(profile).length;", to: "return lowTierCandidate(profile, results);" },
  { id: "M2", name: "Gate 3 (business case) always proposed N/A", from: "const na3 = common.length === 0;", to: "const na3 = true;" },
  { id: "M2b", name: "Gate 1 always proposed N/A", from: "const na1 = reasons1.length === 0;", to: "const na1 = true;" },
  { id: "M3", name: "Investment 'Unsure' treated as 'No'", from: "if (newInvestmentOf(profile) !== NEW_INVESTMENT.no) common.push(", to: "if (newInvestmentOf(profile) === NEW_INVESTMENT.yes) common.push(" },
  { id: "M4", name: "Gate 1 and 3 rule ignores the risk tier", from: 'if (tier !== "Low" && tier !== "Medium") common.push(', to: "if (false) common.push(" },
  { id: "M5", name: "Gate 1 and 3 rule ignores 'can it act?'", from: 'if (isActionCapable(profile, results && results.triggerIds)) common.push("the use can act");', to: "" },
  { id: "M6", name: "A system new to the Council skips Gate 1", from: 'const existing = /^AIR-[A-Z0-9]/i.test((profile && profile.registerId) || "");', to: "const existing = true;" },
  { id: "M7", name: "Unknown procurement route counts as no investment", from: 'if (proc === PROCUREMENT.unknown) common.push(', to: "if (false) common.push(" },
  { id: "M8", name: "Found-in-use AI allowed onto Light-touch", from: "const newUse = situationOf(profile) === SITUATIONS.new && !isFoundInUse(profile);", to: "const newUse = true;" },
  { id: "M9", name: "Per-action review 'Unsure' treated as Yes (drops the Critical floor)", from: 'if (authority === ACTION_AUTHORITY.unsure) return "Unsure";', to: 'if (authority === ACTION_AUTHORITY.unsure) return "Yes";' },
  { id: "M10", name: "Impact 5 floor removed", from: 'const impactFloorTier = Number(impact) === 5 ? "Medium" : null;', to: "const impactFloorTier = null;" },
  { id: "M11", name: "Public-facing no longer contradicts an all-No Fast Track", from: 'if (p.publicFacing === "Yes") out.push(', to: "if (false) out.push(" },
  { id: "M13", name: "Lapsed system approval not checked", from: "if (existing && systemApprovalOf(profile) !== SYSTEM_APPROVAL.yes) common.push(", to: "if (false) common.push(" },
  { id: "M14", name: "Contradiction warning removed", from: "if (newInvestmentOf(profile) === NEW_INVESTMENT.no && procurementRouteOf(profile) === PROCUREMENT.new) {", to: "if (false) {" },
  { id: "M15", name: "Fast-Track versus risk-tier mismatch not flagged", from: 'if (fastTrackOf(profile) === FAST_TRACK.allNo && tier && tier !== "Low") {', to: "if (false) {" },
  { id: "M16", name: "T3 agents get only the core Agent Record", from: 'if (tier === null || tier >= 3 || mult.includes("Financial authority")) {', to: 'if (tier === null || tier >= 4 || mult.includes("Financial authority")) {' },
  { id: "M17", name: "Delegation no longer switches on the Authority Graph", from: 'Delegation: ["Authority & Delegations", "Multi-Agent Controls", "Agent Authority Graph (AIG-AGT-05)"],', to: "" },
  { id: "M12", name: "Screening not carried to Gate 6 when Gates 1 and 3 are N/A", from: "...(g13.na3 && !gate5Required ? CARRIED_FROM_GATES_1_3 : []),", to: "" },
];

function load(src) {
  const m = { exports: {} };
  vm.runInNewContext(src, { module: m, globalThis: {}, Intl, console });
  return m.exports;
}
function runAll(L) {
  const failed = [];
  for (const s of QA.SCENARIOS.filter((x) => x.kind === "engine")) {
    const r = R.run(L, QA, s);
    if (!r || r.error || !r.pass) failed.push(s.id);
  }
  return failed;
}

const baseline = runAll(load(SRC));
if (baseline.length) { console.error("Baseline fails:", baseline.join(", ")); process.exit(1); }
const results = MUTATIONS.map((m) => {
  if (!SRC.includes(m.from)) return { id: m.id, name: m.name, note: m.note, applied: false, caughtBy: [] };
  const failed = runAll(load(SRC.replace(m.from, m.to)));
  return { id: m.id, name: m.name, note: m.note, applied: true, caught: failed.length > 0, caughtBy: failed };
});
const out = { date: new Date().toISOString().slice(0, 10), engine: fs.readFileSync(path.join(__dirname, "..", "engine", "SOURCE.txt"), "utf8").trim(), results };
const dir = path.join(__dirname, "..", "results");
fs.writeFileSync(path.join(dir, "mutation-results.json"), JSON.stringify(out, null, 1));
fs.writeFileSync(path.join(dir, "mutation-results.js"), "window.QA_MUTATIONS = " + JSON.stringify(out) + ";\n");
for (const r of results) console.log(r.id, r.applied ? (r.caught ? "CAUGHT by " + r.caughtBy.join(", ") : "MISSED") : "NOT APPLIED (code moved)", "-", r.name);
if (results.some((r) => !r.applied || !r.caught)) process.exitCode = 1;

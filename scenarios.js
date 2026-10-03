/* AI Governance QA Scenarios: the specification.
 * Every expected result here is written from the suite's own rules (the clause is
 * cited in `ref`), not copied from the engine's output. The runner then asks the
 * real triage engine and compares. A mismatch means either the engine or the rule
 * text is wrong, and both are worth knowing.
 *
 * kind: "engine"    run automatically against the triage engine
 *       "workbook"  Gate Log formula check, reproduced by scripts/check-gate-log.py
 *       "procedure" a human control (form, steward, decision-maker); steps listed
 * gates: Gates 1 to 6 as R (Required) / N (Not applicable) / C (Conditional)
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.QA = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SUITE = "v3.9.7 (3 October 2026)";
  const NO_INVEST = "No — existing approved system and licence, no new cost";

  // A new use of Microsoft 365 Copilot, already on the Register (fictional AIR-SIM1).
  const BASE = {
    situation: "New use", fastTrack: "All ten No", registerId: "AIR-SIM1", ucId: "UC-SIM-02",
    ucIdStatus: "Existing — operator says verified; owner must re-check",
    systemName: "SIMULATION: Microsoft 365 Copilot", purpose: "Generative assistant in Office and Teams",
    usePurpose: "Summarise the team's internal meeting notes into actions and owners",
    serviceArea: "Customer Services", serviceOwner: "Service Manager", supplierDeveloper: "Microsoft",
    source: "Embedded in platform / supplier feature", capability: "Generative AI",
    actionAuthority: "None — outputs only", systemsAccessed: "Team meeting notes the user can open",
    lifecycle: "Idea", dataType: "Personal data", procurementRoute: "Existing contract or licence",
    newInvestment: NO_INVEST, systemApproval: "Yes — Approved and Active, review not overdue", affectsIndividuals: "No", publicFacing: "No", dateFirstUsed: "",
  };
  const AGPI_LOW = { resident: 1, trust: 2, legal: 2, visibility: 2, strategic: 1, oversight: 1 }; // 13.75, Priority 5
  const AGPI_P4 = { resident: 3, trust: 2, legal: 2, visibility: 2, strategic: 3, oversight: 2 };  // 33.75, Priority 4
  // Risk presets: [impacts resident, legal, reputation, operational, financial], likelihood
  const RISK = {
    LOW: [[1, 2, 2, 1, 1], 2],     // inherent 4, Low
    MEDIUM: [[3, 3, 2, 2, 1], 3],  // inherent 9, Medium
    HIGH: [[4, 3, 3, 3, 2], 3],    // inherent 12, High
    CRITICAL: [[5, 5, 4, 4, 3], 5],// inherent 25, Critical
    IMPACT5: [[5, 1, 1, 1, 1], 1], // inherent 5 but Impact 5 floor -> Medium
  };

  const R = {
    g13: "AIG-DEC-01 v1.12 Gate 1 and 3 rule",
    g2: "AIG-DEC-01 v1.11 Gate 2 (mandatory for High, Critical and action-capable uses)",
    g4: "AIG-DEC-01 v1.11 Gate 4 rule",
    g5: "AIG-DEC-01 v1.11 Gate 5 (from Medium)",
    lt: "Playbook §3.8.2.1 and Appendix F.6; AIG-INV-02 v1.8",
    found: "Playbook §3.8; AIG-INV-02 (found in use is never Fast Track)",
    change: "AIG-DEC-01 Gate 7 (re-entry on the same AIR-ID)",
    tier: "Playbook §3.10.1, §4.4.4, §4.4.6; AIG-ASS-02",
    agentic: "Playbook §4.4.6 agentic trigger; AIG-DEC-01 rules R1 to R3",
    screen: "Playbook §4.6 screening by reference; AIG-INV-02 Part C",
    gl: "AIG-DEC-04 v1.2 row checks",
  };

  const GROUPS = {
    A: ["System and use identity", "AIR-ID and UC-ID combinations, and what is happening to the use."],
    B: ["Money and procurement", "The new-investment question and the procurement route, which decide Gates 1, 3 and 4."],
    C: ["Risk tier", "How the governing tier changes the route, the gates and the assessments."],
    D: ["Can it act?", "Action-capable uses and the agentic floors."],
    E: ["Fast Track", "When Light-touch is and is not available."],
    F: ["Screening by reference", "When an existing assessment can be cited, and when fresh screening is needed."],
    G: ["Gate Log checks", "Mechanical row checks in the Gate Log workbook."],
    H: ["After the decision", "Pause, review, change, retirement and the Post-Deployment handoff."],
  };

  const S = [
    // ---------------- A identity ----------------
    { id: "A1", g: "A", kind: "engine", t: "Brand-new system (no AIR-ID), free public tool, low-risk staff use",
      p: { registerId: "", source: "Free / public tool", procurementRoute: "Free public tool" }, risk: "LOW",
      expect: { tier: "Low", route: "light", gates: "RCNNCR", g6carries: true }, ref: [R.g13, R.g4, R.lt],
      why: "A tool new to the Council always goes to Gate 1 (should the Council take it on?), even if free. With no money involved, Gate 3 (the business case) is N/A and its screening, purpose and benefits move to Gate 6.",
      decided: "3 October 2026: keep Gate 1 for any new system; drop Gate 3 where there is no cost (AIG-DEC-01 v1.12)." },
    { id: "A1b", g: "A", kind: "engine", t: "Brand-new system that needs a new contract",
      p: { registerId: "", source: "Procured", procurementRoute: "New contract, licence change or contract variation", newInvestment: "Yes", fastTrack: "One or more Yes or Unsure" }, risk: "LOW",
      expect: { route: "standard", gates: "RCRRCR" }, ref: [R.g13, R.g4], why: "New money: Gates 1, 3 and 4 all apply." },
    { id: "A2", g: "A", kind: "engine", t: "Existing approved system, new use, no new money (the Copilot meeting-notes case)",
      p: {}, risk: "LOW", expect: { tier: "Low", route: "light", gates: "NCNNCR", g6carries: true }, ref: [R.g13, R.lt, R.screen],
      why: "The baseline case: intake event, one delegated decision at Gate 6, annual review. What Gates 1 and 3 carried moves to Gate 6." },
    { id: "A3", g: "A", kind: "procedure", t: "Use matches an existing approved use exactly",
      steps: ["Route Finder: choose 'I want to use a tool that's already approved', answer 'Yes' to 'Does your use match the approval exactly?'.", "Check the decision record: AIR-ID, UC-ID, purpose, data, users and conditions; Register shows Approved and Active."],
      expected: "No new intake. Route Finder shows the 'covered by the existing approval' route.", ref: ["Route Finder step 1a; AIG-DEC-03"] },
    { id: "A4", g: "A", kind: "engine", t: "Another team wants a use already approved for a different team",
      p: { serviceArea: "Housing Services" }, risk: "LOW", expect: { tier: "Low", route: "light", gates: "NCNNCR" }, ref: ["AIG-DEC-03 (permitted users are part of the decision)", "Playbook v19.9.17 §3.10 (another team takes its own UC-ID)", R.g13],
      why: "The approval names its users, so a new team is outside it. It takes its own UC-ID and is triaged as a new use: no Gates 1 or 3, one delegated decision.",
      decided: "3 October 2026: a new UC-ID with its own decision and conditions (Playbook v19.9.17 §3.10)." },
    { id: "A5", g: "A", kind: "engine", t: "Change to an approved use (new data or purpose), no new money",
      p: { situation: "Change to a use in governance" }, risk: "LOW", expect: { tier: "Low", route: "re-entry", light: false, gates: "NCNNCR" }, ref: [R.change, R.g13],
      why: "The changed use re-enters intake on the same AIR-ID and is never Light-touch, but with no new money, at Low and unable to act, Gates 1 and 3 do not apply: it goes to the delegated decision.",
      decided: "3 October 2026: a no-cost change at Low or Medium skips the investment gates but still re-enters intake (AIG-DEC-01 v1.12)." },
    { id: "A5b", g: "A", kind: "engine", t: "Change to an approved use that needs new money",
      p: { situation: "Change to a use in governance", newInvestment: "Yes" }, risk: "LOW", expect: { route: "re-entry", light: false, gates: "RCRNCR" }, ref: [R.change, R.g13],
      why: "New money brings Gates 1 and 3 back." },
    { id: "A6", g: "A", kind: "engine", t: "New use of a system whose approval has lapsed",
      p: { systemApproval: "No — suspended, lapsed or review overdue" }, risk: "LOW", expect: { tier: "Low", route: "light", gates: "RCRNCR" }, ref: [R.g13, "AIG-INV-03 v1.9 (Is the system's approval current?)"],
      why: "Gates 1 and 3 only fall away when the existing system's approval is confirmed current. The governance steward also checks the answer against the Register.",
      decided: "3 October 2026: Intake and the triage tool ask whether the system's approval is current (Unsure counts as No)." },
    { id: "A6b", g: "A", kind: "engine", t: "Approval status not known (Unsure)",
      p: { systemApproval: "Unsure (counts as No)" }, risk: "LOW", expect: { gates: "RCRNCR" }, ref: [R.g13], why: "Unsure counts as No." },
    { id: "A7", g: "A", kind: "engine", t: "AI found already in use, never registered (shadow AI)",
      p: { situation: "Found already in use", registerId: "", lifecycle: "Live", procurementRoute: "Not yet known", newInvestment: "Unsure (counts as Yes)" }, risk: "LOW",
      expect: { tier: "Low", route: "retrospective", light: false, gates: "RCRCCR" }, ref: [R.found, R.g13],
      why: "Never Fast Track or Light-touch; Gate 6 is a continuation decision." },
    { id: "A8", g: "A", kind: "engine", t: "Staff already using registered Copilot for an unapproved purpose",
      p: { situation: "Found already in use", lifecycle: "Live" }, risk: "LOW",
      expect: { tier: "Low", route: "retrospective", light: false, gates: "RCRNCR" }, ref: [R.found, R.g13],
      why: "A live, unapproved use is found-in-use even on an existing AIR-ID, so Gates 1 and 3 stay Required." },
    { id: "A9", g: "A", kind: "engine", t: "UC-ID not yet assigned when triage runs",
      p: { ucId: "", ucIdStatus: "Pending — no UC-ID entered" }, risk: "LOW", expect: { tier: "Low", route: "light", gates: "NCNNCR", planUcBlank: true }, ref: [R.g13, R.gl],
      why: "Gate plan rows leave the UC-ID blank, so the Gate Log flags 'UC-ID required' until the steward adds it." },
    { id: "A10", g: "A", kind: "engine", t: "AIR-ID typed wrongly ('AIR-' or a name)",
      p: { registerId: "AIR-" }, risk: "LOW", expect: { tier: "Low", route: "light", gates: "RCNNCR" }, ref: [R.g13],
      why: "An incomplete AIR-ID is treated as no AIR-ID, so the use is treated as a new system: Gate 1 applies, Gate 3 does not (no money)." },
    { id: "A10b", g: "A", kind: "engine", t: "AIR-ID field holds the product name instead of an ID",
      p: { registerId: "Copilot" }, risk: "LOW", expect: { tier: "Low", route: "light", gates: "RCNNCR" }, ref: [R.g13] },
    { id: "A11", g: "A", kind: "procedure", t: "One request that covers two different uses",
      steps: ["Split into two UC-IDs, e.g. meeting summaries and drafting replies to residents.", "Triage each separately in the triage tool."],
      expected: "Each use gets its own route; the resident-facing drafting use is not Light-touch (Q5 Yes).", ref: ["Playbook §3.10.1 (a lower-risk use must not conceal a higher-risk use)"] },

    // ---------------- B money ----------------
    { id: "B1", g: "B", kind: "engine", t: "Existing system, new use, investment Unsure",
      p: { newInvestment: "Unsure (counts as Yes)" }, risk: "LOW", expect: { route: "light", gates: "RCRNCR" }, ref: [R.g13], why: "Unsure counts as Yes." },
    { id: "B1b", g: "B", kind: "engine", t: "Investment question left unanswered",
      p: { newInvestment: undefined }, risk: "LOW", expect: { route: "light", gates: "RCRNCR" }, ref: [R.g13], why: "No answer defaults to Unsure." },
    { id: "B2", g: "B", kind: "engine", t: "Existing system, new use needs extra licences",
      p: { newInvestment: "Yes", procurementRoute: "New contract, licence change or contract variation", fastTrack: "One or more Yes or Unsure" }, risk: "LOW",
      expect: { route: "standard", gates: "RCRRCR" }, ref: [R.g13, R.g4] },
    { id: "B3", g: "B", kind: "engine", t: "Investment No, but procurement route not yet known",
      p: { procurementRoute: "Not yet known" }, risk: "LOW", expect: { route: "light", gates: "RCRCCR" }, ref: [R.g13, R.g4],
      why: "An unknown procurement route counts as possible new investment." },
    { id: "B4", g: "B", kind: "engine", t: "Investment No, but procurement says new contract (contradiction)",
      p: { procurementRoute: "New contract, licence change or contract variation" }, risk: "LOW", expect: { route: "standard", light: false, gates: "RCRRCR", answerWarn: /no new investment, but a new contract/ }, ref: [R.g13, R.g4, R.lt],
      why: "The stricter answer wins: Gates 1, 3 and 4 Required, and supplier due diligence is indicated, so it is not Light-touch (Fast-Track Q9 would also be Yes).", decided: "3 October 2026: keep the stricter answer and warn the person (triage tool and Route Finder)." },
    { id: "B5", g: "B", kind: "engine", t: "Existing in-house system, new use, no new money",
      p: { source: "Internally developed", procurementRoute: "Built in-house" }, risk: "LOW", expect: { route: "light", gates: "NCNNCR" }, ref: [R.g13, R.g4] },
    { id: "B6", g: "B", kind: "engine", t: "Existing system charged per use (metered)",
      p: { newInvestment: "Yes" }, risk: "LOW", expect: { route: "light", gates: "RCRNCR" }, ref: [R.g13], why: "Usage charges count as new investment." },
    { id: "B7", g: "B", kind: "engine", t: "New system that is a free public tool (e.g. a free chatbot)",
      p: { registerId: "", source: "Free / public tool", procurementRoute: "Free public tool", capability: "Generative AI" }, risk: "LOW",
      expect: { route: "light", gates: "RCNNCR" }, ref: [R.g13, R.g4], why: "Same as A1: Gate 1 for a new tool, no Gate 3 without money." },

    // ---------------- C tier ----------------
    { id: "C1", g: "C", kind: "engine", t: "Medium risk, existing system, no new money",
      p: {}, risk: "MEDIUM", expect: { tier: "Medium", route: "standard", light: false, gates: "NCNNRR", g5carries: true }, ref: [R.g13, R.g5],
      why: "Gates 1 and 3 N/A; Gate 5 Required and receives the screening, purpose and benefits." },
    { id: "C2", g: "C", kind: "engine", t: "High risk, existing system, no new money",
      p: { fastTrack: "One or more Yes or Unsure" }, risk: "HIGH", expect: { tier: "High", route: "standard", gates: "RRRNRR" }, ref: [R.g13, R.g2],
      why: "Gates 1 and 3 stay Required at High even with no new money." },
    { id: "C3", g: "C", kind: "engine", t: "Critical risk",
      p: { fastTrack: "One or more Yes or Unsure" }, risk: "CRITICAL", expect: { tier: "Critical", route: "standard", gates: "RRRNRR" }, ref: [R.tier, R.g2] },
    { id: "C4", g: "C", kind: "engine", t: "Severe impact (5) on one dimension, but unlikely",
      p: { fastTrack: "One or more Yes or Unsure" }, risk: "IMPACT5", expect: { tier: "Medium", route: "standard", gates: "NCNNRR" }, ref: ["Playbook §4.4.4 impact floor", R.g13],
      why: "The impact floor lifts the governing tier to at least Medium." },
    { id: "C5", g: "C", kind: "engine", t: "Resident Impact scored 5 in AGPI",
      p: {}, risk: "LOW", agpi: { ...AGPI_LOW, resident: 5 }, expect: { tier: "Low", priorityAtMost: 2, light: false, gates: "NCNNCR" }, ref: ["Playbook §3.9.6 priority floor"],
      why: "Priority at least 2 (urgency only). It takes the use out of Light-touch (Priority 4 or 5 only) but does not change the gates." },
    { id: "C6", g: "C", kind: "engine", t: "Mandatory trigger: special category data",
      p: { dataType: "Special category data" }, triggers: ["specialData"], risk: "LOW", expect: { tier: "High", light: false, gates: "RRRNRR", conflict: /Q2/ }, ref: ["Playbook §4.4.6", R.lt],
      why: "Trigger floor High; never Priority 5; never Light-touch." },
    { id: "C7", g: "C", kind: "engine", t: "Controls planned but not evidenced",
      p: {}, risk: "MEDIUM", control: 2, evidence: "Not evidenced — planned or unverified", expect: { tier: "Medium" }, ref: ["AIG-ASS-02 E37:E41"],
      why: "Until controls are evidenced, the inherent tier governs." },
    { id: "C7b", g: "C", kind: "engine", t: "Same controls, evidenced with a reference",
      p: {}, risk: "MEDIUM", control: 2, evidence: "Implemented and evidenced", evidenceRef: "EV-CTRL-01", expect: { tier: "Low" }, ref: ["AIG-ASS-02 E37:E41"],
      why: "Evidenced controls let the residual tier govern (a High or Critical reduction would also need independent verification)." },

    // ---------------- D act ----------------
    { id: "D1", g: "D", kind: "engine", t: "Can act, but a person approves every action",
      p: { actionAuthority: "Human approves each action", fastTrack: "One or more Yes or Unsure" }, risk: "LOW", expect: { route: "agentic", gates: "RRRNCR" }, ref: [R.agentic, R.g2, R.g13],
      why: "Gates 2 and 6 mandatory; Gates 1 and 3 Required because it can act." },
    { id: "D2", g: "D", kind: "engine", t: "Acts within limits without per-action review",
      p: { actionAuthority: "Acts within defined bounds — monitored", fastTrack: "One or more Yes or Unsure" }, risk: "LOW", expect: { tier: "Critical", route: "agentic", gates: "RRRNRR" }, ref: [R.agentic] },
    { id: "D3", g: "D", kind: "engine", t: "'Can it act?' answered Unsure",
      p: { actionAuthority: "Unsure — not yet confirmed", fastTrack: "One or more Yes or Unsure" }, risk: "LOW", expect: { tier: "Critical", route: "agentic", gates: "RRRNRR" }, ref: [R.agentic],
      why: "Unsure counts as Yes, and per-action review counts as No." },
    { id: "D4", g: "D", kind: "engine", t: "Copilot agent acting fully autonomously (e.g. sending emails)",
      p: { actionAuthority: "Fully autonomous", fastTrack: "One or more Yes or Unsure" }, risk: "LOW", expect: { tier: "Critical", route: "agentic", gates: "RRRNRR" }, ref: [R.agentic, R.g13],
      why: "Same licence, but it can act: no Light-touch, Gates 1 and 3 Required." },

    // ---------------- E fast track ----------------
    { id: "E1", g: "E", kind: "engine", t: "All ten No and the rest of the form agrees",
      p: {}, risk: "LOW", expect: { route: "light", light: true }, ref: [R.lt] },
    { id: "E2", g: "E", kind: "engine", t: "One answer Yes or Unsure",
      p: { fastTrack: "One or more Yes or Unsure" }, risk: "LOW", expect: { route: "standard", light: false, block: /at least one Yes or Unsure/ }, ref: [R.lt] },
    { id: "E4", g: "E", kind: "engine", t: "Fast Track not done",
      p: { fastTrack: "Not done (full Intake)" }, risk: "LOW", expect: { route: "standard", light: false, block: /No Fast-Track Screening/ }, ref: [R.lt] },
    { id: "E5", g: "E", kind: "engine", t: "All No, but the form says special category data",
      p: { dataType: "Special category data" }, risk: "LOW", expect: { light: false, conflict: /Q2/ }, ref: [R.lt] },
    { id: "E6", g: "E", kind: "engine", t: "All No, but the form says public-facing",
      p: { publicFacing: "Yes" }, risk: "LOW", expect: { light: false, conflict: /Q5/ }, ref: [R.lt] },
    { id: "E7", g: "E", kind: "engine", t: "All No, but outputs could affect individuals or services",
      p: { affectsIndividuals: "Yes" }, risk: "LOW", expect: { light: false, conflict: /Q3 or Q4/ }, ref: [R.lt] },
    { id: "E8", g: "E", kind: "engine", t: "All No, but the tier comes out Medium",
      p: {}, risk: "MEDIUM", expect: { tier: "Medium", route: "standard", light: false, gates: "NCNNRR", answerWarn: /All ten Fast-Track answers are No, but the risk scores give Medium/ }, ref: [R.lt, R.g13],
      why: "The higher tier applies, and the tool flags the mismatch so the Fast-Track answers and the risk scores are checked with the AI Governance Lead.",
      decided: "3 October 2026: keep the higher tier and flag the mismatch (triage tool)." },
    { id: "E9", g: "E", kind: "engine", t: "All No, but Governance Investigation Required",
      p: {}, risk: "LOW", investigation: "Yes", expect: { light: false }, ref: ["AIG-ASS-01 B19"] },
    { id: "E10", g: "E", kind: "engine", t: "All No at Priority 4",
      p: {}, risk: "LOW", agpi: AGPI_P4, expect: { route: "light", light: true, priority: /^Priority 4/ }, ref: [R.lt, "Light-touch / Low / Priority 4 or 5"] },

    // ---------------- F screening ----------------
    { id: "F1", g: "F", kind: "procedure", t: "Existing assessment is current and covers the new use", status: "verified",
      steps: ["Fast-Track Part C: cite EV-SIM-EQ, EV-SIM-HR, EV-SIM-DPIA with version, owner and status.", "Answer 'Within scope' Yes for each, give a reasoned outcome and carry the conditions over.", "DPO confirms; the decision-maker ticks the screening line in AIG-DEC-03."],
      expected: "Screening complete by reference; no separate screening forms.", ref: [R.screen], evidence: "Simulation pack UC-SIM-02 (new use), 3 October 2026" },
    { id: "F2", g: "F", kind: "procedure", t: "Existing DPIA does not cover the new data (e.g. resident case notes)",
      steps: ["Data protection row: 'Within scope' No.", "Screen only what is new; Q2 or Q3 will also be Yes."], expected: "Fresh screening of the new part; probably not Light-touch.", ref: [R.screen] },
    { id: "F3", g: "F", kind: "procedure", t: "No existing assessment to cite",
      steps: ["Complete AIG-ASS-06, AIG-ASS-07 and AIG-ASS-05 screening."], expected: "Short screenings completed; later uses can cite them.", ref: [R.screen], status: "verified", evidence: "Simulation pack UC-SIM-02 (first run), 3 October 2026" },
    { id: "F4", g: "F", kind: "procedure", t: "Assessment out of date, still a draft, or not in the evidence index",
      steps: ["Check the AIG-INV-04 evidence index: status Accepted, with version and owner.", "Check it was completed or last reviewed within 12 months and its review date has not passed."], expected: "If not, it cannot be cited until its owner records a 'still holds' review, or a fresh screening is done.", ref: [R.screen],
      decided: "3 October 2026: completed or reviewed within the last 12 months, with its own review date not passed; an older one needs a recorded 'still holds' review by its owner (Playbook §4.6)." },
    { id: "F5", g: "F", kind: "procedure", t: "Model or settings changed since the assessment",
      steps: ["Compare the system's change log with the assessment date."], expected: "Cannot cite until the assessment is updated.", ref: [R.screen] },
    { id: "F6", g: "F", kind: "procedure", t: "Equality covered, human rights engagement uncertain",
      steps: ["Human rights row: refer to Legal Services."], expected: "Legal referral recorded before the decision.", ref: [R.screen, "Playbook §4.6.3"] },
    { id: "F7", g: "F", kind: "procedure", t: "DPO has not confirmed the DPIA applies",
      steps: ["Data protection row left without DPO confirmation."], expected: "The decision cannot be taken.", ref: [R.screen, "Playbook §4.6.1"] },
    { id: "F8", g: "F", kind: "procedure", t: "Decision-maker does not tick the screening line",
      steps: ["AIG-DEC-03 'Assessments reviewed': screening line left unticked.", "Gate Log column X 'Screening considered by the decision-maker' left blank or No."], expected: "Decision record incomplete, and the Gate Log row check flags the Decision event (see G9).", ref: ["AIG-DEC-03 v1.9", "AIG-DEC-04 v1.3 column X", "Equality Act 2010 s149"],
      decided: "3 October 2026: the Gate Log checks it too (new column X; AIG-DEC-04 v1.3)." },
    { id: "F9", g: "F", kind: "procedure", t: "The cited assessment is later revised",
      steps: ["Search the evidence index and decision records for the Evidence ID."], expected: "Every use relying on it is found and re-checked; the annual review re-confirms.", ref: [R.screen] },

    // ---------------- G gate log ----------------
    { id: "G1", g: "G", kind: "workbook", t: "N/A plan row with no rationale", sheet: "Gate plan", message: "Not applicable needs rationale and authority ref", ref: [R.gl] },
    { id: "G1b", g: "G", kind: "workbook", t: "Plan row with no Requirement", sheet: "Gate plan", message: "Requirement missing", ref: [R.gl] },
    { id: "G1c", g: "G", kind: "workbook", t: "Plan row with no Plan state", sheet: "Gate plan", message: "Plan state missing", ref: [R.gl] },
    { id: "G2", g: "G", kind: "workbook", t: "Event linked to a plan row for a different gate", sheet: "Gate events", message: "Plan gate differs from event gate", ref: [R.gl] },
    { id: "G2b", g: "G", kind: "workbook", t: "Event linked to a plan row for a different UC-ID", sheet: "Gate events", message: "Plan UC-ID differs from event UC-ID", ref: [R.gl] },
    { id: "G3", g: "G", kind: "workbook", t: "Intake event with outcome 'Opinion only'", sheet: "Gate events", message: "Opinion only is for Assurance opinion or Review only events", ref: [R.gl] },
    { id: "G3b", g: "G", kind: "workbook", t: "Assurance opinion event with no reference", sheet: "Gate events", message: "Assurance opinion ref missing", ref: [R.gl] },
    { id: "G4", g: "G", kind: "workbook", t: "Two UC-IDs in one event (space or slash)", sheet: "Gate events", message: "One UC-ID per event row: split this event", ref: [R.gl] },
    { id: "G5", g: "G", kind: "workbook", t: "Pause follow-up date before the pause", sheet: "Gate events", message: "Follow-up decision due date is before the pause", ref: [R.gl] },
    { id: "G6", g: "G", kind: "workbook", t: "Condition state Unknown", sheet: "Conditions", message: "State Unknown: owner to confirm", ref: [R.gl] },
    { id: "G9", g: "G", kind: "workbook", t: "Decision to proceed with no 'screening considered' confirmation", sheet: "Gate events", message: "Decision-maker has not confirmed the screening was considered (column X)", ref: ["AIG-DEC-04 v1.3 column X"] },
    { id: "G9b", g: "G", kind: "workbook", t: "Re-authorise with 'screening considered' answered No", sheet: "Gate events", message: "Decision-maker has not confirmed the screening was considered (column X)", ref: ["AIG-DEC-04 v1.3 column X"] },
    { id: "G7", g: "G", kind: "workbook", t: "A complete, correct row", sheet: "All sheets", message: "Check against source", ref: [R.gl], why: "The control: valid rows must still pass." },
    { id: "G8", g: "G", kind: "engine", t: "Tool export warns not to paste over column M", p: {}, risk: "LOW", expect: { columnM: true, planJBlank: true }, ref: [R.gl],
      why: "Column M is the workbook row check; column J is left for the steward.", decided: "3 October 2026: keep the warning and lock the row-check columns in the Gate Log with sheet protection, no password (AIG-DEC-04 v1.3)." },
    { id: "G8b", g: "G", kind: "procedure", t: "Row-check columns are locked in the workbook", status: "verified",
      steps: ["Open AIG-DEC-04 v1.3; try to type or paste into Gate plan M, Gate events N or Q, or Conditions J.", "Type into any input column on the same rows."],
      expected: "Excel refuses the edit to a row-check column; input columns stay editable; filtering and sorting still work. The steward can unprotect the sheet (no password) for maintenance.",
      ref: ["AIG-DEC-04 v1.3 sheet protection"], evidence: "Workbook read back on 3 October 2026: sheets protected; row-check cells locked, every input cell (rows 4 to 553) unlocked" },

    // ---------------- H after ----------------
    { id: "H1", g: "H", kind: "procedure", t: "Incident: precautionary pause", steps: ["Post-Deployment: record a Precautionary pause event with incident ref and follow-up date."], expected: "Containment event; no decision reference needed.", ref: ["Playbook §4.7.17", R.gl] },
    { id: "H2", g: "H", kind: "workbook", t: "Resume straight after a precautionary pause (with a new condition)", sheet: "Gate events", message: "Check against source", ref: ["AIG-DEC-04 v1.3 Lists row 16", "Playbook §4.7.17"],
      decided: "3 October 2026: add a 'Resume' outcome, allowed only as the next event for the same use after the pause; it carries over the approval (AIG-DEC-04 v1.3, AIG-DEC-03 v1.10)." },
    { id: "H2b", g: "H", kind: "workbook", t: "Resume when the last event for that use was not the pause", sheet: "Gate events", message: "Resume is only for the event straight after a Precautionary pause on the same AIR-ID and UC-ID (in an earlier row)", ref: ["AIG-DEC-04 v1.3"] },
    { id: "H2c", g: "H", kind: "workbook", t: "Resume for a use that was never paused", sheet: "Gate events", message: "Resume is only for the event straight after a Precautionary pause on the same AIR-ID and UC-ID (in an earlier row)", ref: ["AIG-DEC-04 v1.3"] },
    { id: "H2d", g: "H", kind: "workbook", t: "Resume with 'screening considered' answered No", sheet: "Gate events", message: "Decision-maker has not confirmed the screening was considered (column X)", ref: ["AIG-DEC-04 v1.3 column X"] },
    { id: "H2e", g: "H", kind: "workbook", t: "Resume entered on an Assurance opinion event", sheet: "Gate events", message: "Outcome implies decision", ref: ["AIG-DEC-04 v1.3"] },
    { id: "H3", g: "H", kind: "procedure", t: "Annual review, no change", steps: ["Gate 7 review event; re-confirm the screening reference."], expected: "Review recorded; screening reference still current.", ref: ["AIG-DEC-01 Gate 7", R.screen] },
    { id: "H4", g: "H", kind: "procedure", t: "Material change after approval", steps: ["Re-enter intake on the same AIR-ID (see A5)."], expected: "Full intake and triage before the changed use continues.", ref: [R.change] },
    { id: "H5", g: "H", kind: "procedure", t: "Retire one use of a multi-use system", steps: ["Triage tool retirement mode for that UC-ID."], expected: "Gate 8 for that UC-ID; the AIR-ID stays until every linked use is closed.", ref: ["AIG-DEC-01 Gate 8"] },
    { id: "H6", g: "H", kind: "procedure", t: "Post-Deployment 'Start from a triage record'", steps: ["Load the canonical triage JSON into the Post-Deployment tool."], expected: "Fills system, AIR-ID, UC-ID and scope; never ticks 'verified' or fills tiers; never overwrites typed values.", ref: ["AIGovernancePostDeployment tests"], status: "verified", evidence: "Post-Deployment test suite (32 tests)" },
  ];

  // Workbook results reproduced by scripts/check-gate-log.py (LibreOffice recalculation).
  const WORKBOOK_RUN = { date: "3 October 2026", workbook: "AIG-DEC-04_Gate_Log_Proposed.xlsx v1.2 draft", method: "Sample rows written to a copy, recalculated with LibreOffice, row-check column read back" };

  return { SUITE, BASE, AGPI_LOW, AGPI_P4, RISK, GROUPS, SCENARIOS: S, WORKBOOK_RUN };
});

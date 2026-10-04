# AI Governance QA Scenarios

A scenario test suite for the proposed AI governance suite (release v3.9.9, 4 October 2026). It checks that the triage engine, the Gate Log, Register and Agent Record workbooks and the human controls behave the way the suite's own rules say they should, across every combination of system, use, money, risk tier, agency, Fast Track and screening we could think of.

**Live page:** https://kimabercromby.github.io/AIGovernanceQAScenarios/

Proposed design draft, not approved Council policy. All records are fictional.

## How the QA works

1. **Rules first.** Every expected result in `scenarios.js` is written from a cited clause (Gate Map AIG-DEC-01, Playbook AIG-GOV-02, Fast-Track AIG-INV-02 and so on), never copied from the engine's output. A failure means the engine and the rule disagree, and either could be wrong.
2. **Three kinds of test.**
   - *Engine* scenarios run against the real triage engine (`engine/triage-logic.js`, the same file the triage tool uses), in the browser and in Node.
   - *Workbook* scenarios check the Gate Log's row-check formulas. `scripts/check-gate-log.py` writes sample rows into a copy of the workbook, recalculates it with LibreOffice and reads each check back; the results are stored in `results/`.
   - *Human control* scenarios cover rules a person applies (the governance steward, the DPO, the decision-maker). They list the steps and, where it exists, the evidence.
3. **Tests that bite.** `scripts/mutation-check.js` puts eighteen realistic bugs into an in-memory copy of the engine, including the Light-touch defect found in the Copilot simulation, and confirms at least one scenario fails for each.
4. **Decisions surfaced.** Where the rules give an answer that may not be wanted, or leave a gap, the scenario carries a "Decision needed" note instead of being passed quietly.

## Coverage

| Group | What it covers |
|---|---|
| A | AIR-ID and UC-ID combinations: new system, existing system, new use, matching use, change, found in use, pending or malformed IDs |
| B | New investment and procurement answers (Gates 1, 3 and 4) |
| C | Low, Medium, High, Critical; impact floor; priority floor; mandatory triggers; evidenced controls |
| D | Action-capable uses and the agentic floors |
| E | Fast Track: all No, Yes or Unsure, not done, contradictions, Medium, investigation, Priority 4 |
| F | Screening by reference to an existing assessment |
| G | Gate Log row checks |
| H | Pause, resume, review, change, retirement, Post-Deployment handoff |

## Run it

```sh
npm test               # engine scenarios against the pinned engine
npm run mutation       # planted-bug check
python3 scripts/check-gate-log.py <AIG-DEC-04_Gate_Log_Proposed.xlsx> [recalc.py]
```

Open `index.html` (or the live page) to run the engine scenarios in the browser. Add `#live` to the address to run them against the live triage tool instead of the pinned copy.

The pinned engine is updated with `sh scripts/sync-engine.sh <path to AIGovernanceTriage-MultiBoard>`; `engine/SOURCE.txt` records the commit it came from. GitHub Actions runs the tests and the mutation check on every push.

## Companion tools

- [Triage tool](https://kimabercromby.github.io/AIGovernanceTriage-MultiBoard/)
- [Lifecycle walkthrough](https://kimabercromby.github.io/AIGovernanceWalkthrough-MultiBoard/)
- [Triage engines simulation](https://kimabercromby.github.io/triage-engines-simulation/)
- [Post-Deployment tool](https://kimabercromby.github.io/AIGovernancePostDeployment/)
- [Suite tools: Route Finder, Suite Map, Flow Builder](https://kimabercromby.github.io/AIGovernanceSuiteTools/)

"use strict";
// Runs every engine scenario in scenarios.js against the vendored triage engine.
// A failure means the engine and the suite's rules disagree.
const test = require("node:test");
const assert = require("node:assert/strict");
const L = require("../engine/triage-logic.js");
const QA = require("../scenarios.js");
const R = require("../runner.js");

for (const s of QA.SCENARIOS.filter((x) => x.kind === "engine")) {
  test(`${s.id} ${s.t}`, () => {
    const r = R.run(L, QA, s);
    assert.ok(!r.error, r.error);
    for (const c of r.checks) assert.ok(c.pass, `${c.label}: expected ${c.expected}, got ${c.actual}`);
    assert.ok(r.checks.length > 0, "scenario has no checks");
  });
}

test("every scenario has a rule reference and a unique id", () => {
  const ids = new Set();
  for (const s of QA.SCENARIOS) {
    assert.ok(!ids.has(s.id), `duplicate ${s.id}`); ids.add(s.id);
    assert.ok(Array.isArray(s.ref) && s.ref.length, `${s.id} has no rule reference`);
  }
});

test("the vendored engine is the suite release the scenarios were written for", () => {
  assert.equal(L.SUITE.release, "v3.9.7");
});

// Workbook scenarios: the recorded LibreOffice run (scripts/check-gate-log.py) must give
// the expected Row check message on every sample row for that scenario.
test("every workbook scenario matches the recorded Gate Log run", () => {
  const run = require("../results/workbook-results.json");
  for (const s of QA.SCENARIOS.filter((x) => x.kind === "workbook")) {
    const rows = run.results.filter((r) => r.scenario === s.id);
    assert.ok(rows.length > 0, `${s.id} has no recorded workbook rows`);
    for (const r of rows) assert.equal(r.message, s.message, `${s.id} ${r.sheet} row ${r.row}`);
  }
});

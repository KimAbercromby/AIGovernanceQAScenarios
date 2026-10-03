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

#!/usr/bin/env python3
"""Reproduce the Gate Log (AIG-DEC-04) workbook checks for scenarios G1 to G7.

Usage: python3 scripts/check-gate-log.py <AIG-DEC-04_Gate_Log_Proposed.xlsx> [path/to/recalc.py]

Writes sample rows into a COPY of the workbook, recalculates it with LibreOffice
(through recalc.py, which opens the copy headless and saves the computed values),
reads each row-check cell back and writes results/workbook-results.json and
results/workbook-results.js. The original workbook is never changed.
"""
import datetime, json, os, shutil, subprocess, sys, tempfile
import openpyxl

src = sys.argv[1]
recalc = sys.argv[2] if len(sys.argv) > 2 else "/mnt/skills/public/xlsx/scripts/recalc.py"
tmp = os.path.join(tempfile.mkdtemp(), "gate-log-test.xlsx")
shutil.copy(src, tmp)
wb = openpyxl.load_workbook(tmp)
P, E, C = wb["Gate plan"], wb["Gate events"], wb["Conditions"]
g6, g1, g0 = "Gate 6 Deployment / go-live", "Gate 1 Strategic prioritisation", "Gate 0 Intake / opportunity"
def put(ws, r, **v):
    for k, x in v.items(): ws[f"{k}{r}"] = x
d = datetime.datetime(2026, 10, 1)
plan = {  # row: (scenario, values)
    4: ("G7", dict(A="PL-1", B="AIR-T001", C=g6, E="Required", F="triage", I="Planned", K="UC-1", L="UC-ID specific")),
    5: ("G1b", dict(A="PL-2", B="AIR-T001", C=g1, F="triage", I="Planned", K="UC-1", L="UC-ID specific")),
    6: ("G1c", dict(A="PL-3", B="AIR-T001", C=g1, E="Required", F="x", K="UC-2", L="UC-ID specific")),
    7: ("G1", dict(A="PL-4", B="AIR-T001", C="Gate 4 Procurement", E="Not applicable", F="x", I="Planned", K="UC-3", L="UC-ID specific")),
}
base = dict(B="AIR-T001", F=d, H="Officer", I="DEC-1", P="UC-ID specific")
events = {
    4: ("G7", dict(A="EV-1", C="PL-1", D=g6, E="Decision", G="Progress", O="UC-1")),
    5: ("G2", dict(A="EV-2", C="PL-1", D=g1, E="Decision", G="Progress", O="UC-1")),
    6: ("G2b", dict(A="EV-3", C="PL-1", D=g6, E="Decision", G="Progress", O="UC-9")),
    7: ("G3b", dict(A="EV-4", D=g6, E="Assurance opinion", G="Opinion only", O="UC-1")),
    8: ("G3", dict(A="EV-5", D=g0, E="Intake / registration", G="Opinion only", O="UC-1")),
    9: ("G4", dict(A="EV-6", D=g6, E="Decision", G="Progress", O="UC-1 UC-2")),
    10: ("G5", dict(A="EV-7", D=g6, E="Precautionary pause (containment)", G="Paused — pending decision", V="INC-1", W=datetime.datetime(2026, 9, 1), O="UC-1")),
    11: ("G7", dict(A="EV-8", D=g0, E="Intake / registration", G="No decision", O="UC-1")),
    12: ("G7", dict(A="EV-9", D=g6, E="Decision", G="Progress with condition", O="UC-1")),
}
conds = {
    4: ("G6", dict(A="C-1", B="EV-9", C="AIR-T001", D="do x", E="Owner", F=datetime.datetime(2027, 1, 1), G="Unknown", K="UC-1", L="UC-ID specific")),
    5: ("G7", dict(A="C-2", B="EV-9", C="AIR-T001", D="do y", E="Owner", F=datetime.datetime(2027, 1, 1), G="Open", K="UC-1", L="UC-ID specific")),
}
for r, (_, v) in plan.items(): put(P, r, **v)
for r, (_, v) in events.items(): put(E, r, **{**base, **v})
for r, (_, v) in conds.items(): put(C, r, **v)
wb.save(tmp)
subprocess.run([sys.executable, os.path.basename(recalc), tmp], cwd=os.path.dirname(recalc), check=True, capture_output=True)
v = openpyxl.load_workbook(tmp, data_only=True)
out = []
for sheet, col, rows in (("Gate plan", "M", plan), ("Gate events", "N", events), ("Conditions", "J", conds)):
    for r, (sid, _) in rows.items():
        out.append({"scenario": sid, "sheet": sheet, "row": r, "message": v[sheet][f"{col}{r}"].value})
version = openpyxl.load_workbook(src)["Document Control"]["B7"].value
res = {"workbook": os.path.basename(src), "version": version, "date": datetime.date.today().isoformat(), "results": out}
here = os.path.join(os.path.dirname(__file__), "..", "results")
json.dump(res, open(os.path.join(here, "workbook-results.json"), "w"), indent=1, ensure_ascii=False)
open(os.path.join(here, "workbook-results.js"), "w").write("window.QA_WORKBOOK = " + json.dumps(res, ensure_ascii=False) + ";\n")
for o in out: print(o["scenario"], o["sheet"], o["row"], o["message"])

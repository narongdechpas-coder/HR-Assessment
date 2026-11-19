"""Convert the Competency Matrix Excel into src/data/framework.json.

Run:  python3 tools/build_framework.py
Re-run whenever HR edits the Excel (targets, dictionary, departments).
"""
import json
import pathlib

import openpyxl

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "source" / "Non_Life_Insurance_Competency_Matrix_Master.xlsx"
OUT = ROOT / "src" / "data" / "framework.json"

wb = openpyxl.load_workbook(SRC, data_only=True)


def rows(sheet):
    return [r for r in wb[sheet].iter_rows(min_row=2, values_only=True) if r[0]]


GROUP = {"Core": "core", "Functional": "functional", "Managerial / Leadership": "leadership"}

departments = [{"id": r[0], "name": r[1], "scope": r[2]} for r in rows("Department Catalogue")]
dept_id = {d["name"]: d["id"] for d in departments}

levels = [{"id": r[0], "title": r[1], "scope": r[2]} for r in rows("Job Levels")]

competencies = [
    {
        "id": r[0],
        "group": GROUP[r[1]],
        "name": r[2],
        "dept": None if r[3] == "All Departments" else dept_id[r[3]],
        "definition": r[4],
        "behaviours": [r[5], r[6], r[7], r[8]],
    }
    for r in rows("Competency Dictionary")
]

# targets[deptId][level][track][competencyId] = 1..4
targets: dict = {}
count = 0
for r in rows("Master Matrix"):
    _, cid, _, dept, level, track, target, *_ = r
    targets.setdefault(dept_id[dept], {}).setdefault(level, {}).setdefault(track, {})[cid] = int(target)
    count += 1

OUT.write_text(
    json.dumps(
        {"departments": departments, "levels": levels, "competencies": competencies, "targets": targets},
        ensure_ascii=False,
        indent=1,
    ),
    encoding="utf-8",
)
print(f"wrote {OUT.relative_to(ROOT)}: {len(competencies)} competencies, {count} matrix rows")

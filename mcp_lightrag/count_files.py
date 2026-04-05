#!/usr/bin/env python3
import os, warnings
from pathlib import Path
warnings.filterwarnings("ignore")

P = Path("/home/goldie/Progs/kursovaya/GoldPC")
EXCL = set(["node_modules", ".git", "venv", ".venv", "obj", "bin", "dist", "build", ".next", "coverage", ".turbo"])

def ff(d, exts):
    r = []
    d = Path(d)
    if not d.exists(): return r
    for root, dirs, fns in os.walk(d):
        dirs[:] = [x for x in dirs if x not in EXCL and not x.startswith("agent-")]
        for fn in fns:
            if any(fn.endswith(e) for e in exts):
                r.append(Path(root)/fn)
    return r

plan = [
    ("Root MD", [f for f in P.glob("*.md") if f.is_file() and f.parent == P and not f.name.startswith(".")]),
    ("docker", ff(P/"docker", [".yml",".yaml",".conf",".sh","Dockerfile"])),
    ("contracts", ff(P/"contracts", [".md",".yml",".yaml",".json"])),
    ("dev-plan", ff(P/"development-plan", [".md"])),
    ("knowledge-base", ff(P/"knowledge-base", [".md",".txt"])),
    ("scripts", ff(P/"scripts", [".sh",".ps1",".py"])),
    (".github", ff(P/".github", [".yml",".yaml",".sh"])),
    (".claude", [f for f in (P/".claude").glob("*.json") if f.is_file()]),
]

for d in sorted((P/"src").iterdir()):
    if d.is_dir() and (d/"Program.cs").exists():
        plan.append((f"svc:{d.name}", ff(d, [".cs",".json"])))

for lib in ["Shared","SharedKernel"]:
    p = P/"src"/lib
    if p.exists():
        plan.append((f"lib:{lib}", ff(p, [".cs",".json",".csproj"])))

t = P/"tests"
if t.exists():
    plan.append(("tests", ff(t, [".cs",".py"])))

total = 0
for name, files in plan:
    total += len(files)
    print(f"  [{name}] {len(files)} files")
print(f"\nTotal: {total} files")

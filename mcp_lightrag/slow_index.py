#!/usr/bin/env python3
"""
Slow but reliable indexer: one file at a time, through MCP stdio.
"""
import json
import subprocess
import os
import sys
from pathlib import Path

P = Path("/home/goldie/Progs/kursovaya/GoldPC")
SERVER_SCRIPT = P / "mcp_lightrag" / "run.sh"

def send_json(proc, id_, method, params=None):
    req = {"jsonrpc": "2.0", "id": id_, "method": method, "params": params or {}}
    proc.stdin.write(json.dumps(req) + "\n")
    proc.stdin.flush()

def get_one_line(fpath):
    try:
        return fpath.read_text(encoding="utf-8", errors="replace").strip()[:200]
    except:
        return ""

def main():
    # Find all files
    ALWAYS = set(["node_modules", ".git", "venv", ".venv", "obj", "bin", "dist", "build", ".next", "coverage", ".turbo"])
    files = []

    # Root markdown
    for f in sorted(P.glob("*.md")):
        if f.is_file() and not f.name.startswith("."):
            files.append(("docs", f))

    # Subdirs
    for dirname, exts in [
        ("docker", [".yml", ".yaml", ".conf", ".sh", "Dockerfile"]),
        ("contracts", [".md", ".yml", ".yaml", ".json"]),
        ("development-plan", [".md"]),
        ("knowledge-base", [".md", ".txt"]),
        ("scripts", [".sh", ".ps1", ".py"]),
        (".github", [".yml", ".yaml", ".sh"]),
    ]:
        d = P / dirname
        if d.exists():
            for root, dirs, fns in os.walk(d):
                dirs[:] = [x for x in dirs if x not in ALWAYS]
                for fn in sorted(fns):
                    if any(fn.endswith(e) for e in exts):
                        files.append((dirname, Path(root)/fn))

    # Services
    for d in sorted((P / "src").iterdir()):
        if d.is_dir() and (d/"Program.cs").exists():
            for root, dirs, fns in os.walk(d):
                dirs[:] = [x for x in dirs if x not in ALWAYS]
                for fn in sorted(fns):
                    if fn.endswith((".cs", ".json")):
                        files.append((f"svc:{d.name}", Path(root)/fn))

    # Shared
    for lib in ["Shared", "SharedKernel"]:
        libp = P / "src" / lib
        if libp.exists():
            for root, dirs, fns in os.walk(libp):
                dirs[:] = [x for x in dirs if x not in ALWAYS]
                for fn in sorted(fns):
                    if fn.endswith((".cs", ".json", ".csproj")):
                        files.append((f"lib:{lib}", Path(root)/fn))

    # Git log
    import subprocess as sp
    r = sp.run(["git", "log", "--pretty=format:%h %ad %s", "--date=short", "-50"],
               capture_output=True, text=True, cwd=P)
    if r.stdout:
        (P / ".git-log-tmp.txt").write_text(r.stdout)
        files.append(("git-log", P / ".git-log-tmp.txt"))

    total = len(files)
    print(f"Found {total} files to index")

    proc = subprocess.Popen(
        ["bash", str(SERVER_SCRIPT)],
        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
        text=True, bufsize=1
    )

    # Initialize
    send_json(proc, 1, "initialize", {
        "protocolVersion": "2024-11-05",
        "capabilities": {},
        "clientInfo": {"name": "indexer", "version": "1.0"}
    })

    for i, (group, fpath) in enumerate(files, 2):
        rel = str(fpath.relative_to(P))
        try:
            content = fpath.read_text(encoding="utf-8", errors="replace")
        except:
            continue

        if not content.strip():
            continue

        # Truncate if too big (100KB limit per file)
        if len(content) > 100000:
            content = content[:80000] + "...[truncated]"

        print(f"[{i}/{total}] {rel} ({len(content):,} chars)")

        req = {
            "jsonrpc": "2.0", "id": i,
            "method": "tools/call",
            "params": {
                "name": "rag_insert",
                "arguments": {"document_text": content, "file_path": rel}
            }
        }
        proc.stdin.write(json.dumps(req) + "\n")
        proc.stdin.flush()

        # Read response (blocking with timeout)
        try:
            line = proc.stdout.readline()
            resp = json.loads(line)
            result = resp.get("result", {}).get("content", [{}])[0].get("text", "")
            print(f"  -> {result[:100]}")
        except Exception as e:
            print(f"  -> Error: {e}")

    # Status check
    send_json(proc, 9999, "tools/call", {"name": "rag_status", "arguments": {}})
    try:
        line = proc.stdout.readline()
        print(f"\nFinal status: {line[:200]}")
    except:
        pass

    proc.stdin.close()
    proc.wait()

    # Cleanup
    if (P / ".git-log-tmp.txt").exists():
        (P / ".git-log-tmp.txt").unlink()

if __name__ == "__main__":
    main()

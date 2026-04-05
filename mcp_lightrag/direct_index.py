#!/usr/bin/env python3
"""Direct indexer — no MCP wrapper, talks to LightRAG directly."""
import asyncio, os, sys, subprocess, warnings
from pathlib import Path

os.environ["CUDA_VISIBLE_DEVICES"] = ""
warnings.filterwarnings("ignore")

P = Path("/home/goldie/Progs/kursovaya/GoldPC")
sys.path.insert(0, str(P / "mcp_lightrag"))

from dotenv import load_dotenv
load_dotenv(P / ".env", override=False)

WORKING_DIR = os.getenv("LIGHTRAG_WORKING_DIR", str(P / ".rag-store"))
LLM_MODEL = os.getenv("LIGHTRAG_LLM_MODEL", "gpt-4o-mini")
EMBEDDING_MODEL = os.getenv("LIGHTRAG_EMBEDDING_MODEL", "BAAI/bge-m3")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "")
os.makedirs(WORKING_DIR, exist_ok=True)


def _build_llm_func():
    from lightrag.llm.openai import openai_complete_if_cache
    from functools import partial
    kwargs = {"model": LLM_MODEL}
    if OPENAI_BASE_URL:
        kwargs["base_url"] = OPENAI_BASE_URL
    return partial(openai_complete_if_cache, **kwargs)


def _build_embed_func():
    from server import _build_local_embedding
    return _build_local_embedding(EMBEDDING_MODEL)


import io


class LineBuffer:

    def __init__(self):
        self._lines = []
        self._lock = asyncio.Lock()

    async def write(self, msg):
        async with self._lock:
            self._lines.append(msg)
            print(msg, flush=True)


buf = LineBuffer()


async def main():
    from lightrag import LightRAG

    llm_func = _build_llm_func()
    embed_func = _build_embed_func()

    print(f"Init LightRAG in {WORKING_DIR}")
    rag = LightRAG(
        working_dir=WORKING_DIR,
        llm_model_func=llm_func,
        embedding_func=embed_func,
    )
    await rag.initialize_storages()

    ALWAYS = set(["node_modules", ".git", "venv", ".venv", "obj", "bin", "dist", "build", ".next", "coverage", ".turbo"])
    files = []

    # Root markdown
    for f in sorted(P.glob("*.md")):
        if f.is_file() and not f.name.startswith("."):
            files.append(f)

    def find(d, exts):
        r = []
        d = Path(d)
        if not d.exists(): return r
        for root, dirs, fns in os.walk(d):
            dirs[:] = [x for x in dirs if x not in ALWAYS]
            for fn in fns:
                if any(fn.endswith(e) for e in exts):
                    r.append(Path(root)/fn)
        return r

    for dirname, exts in [
        ("docker", [".yml", ".yaml", ".conf", ".sh", "Dockerfile"]),
        ("contracts", [".md", ".yml", ".yaml", ".json"]),
        ("development-plan", [".md"]),
        ("knowledge-base", [".md", ".txt"]),
        ("scripts", [".sh", ".ps1", ".py"]),
        (".github", [".yml", ".yaml", ".sh"]),
    ]:
        files.extend(find(P / dirname, exts))

    # Services
    src = P / "src"
    if src.exists():
        for d in sorted(src.iterdir()):
            if d.is_dir() and (d/"Program.cs").exists():
                files.extend(find(d, [".cs", ".json"]))

    for lib in ["Shared", "SharedKernel"]:
        libp = src / lib
        if libp.exists():
            files.extend(find(libp, [".cs", ".json", ".csproj"]))

    tests = P / "tests"
    if tests.exists():
        files.extend(find(tests, [".cs", ".py"]))

    total = len(files)
    print(f"\nTotal: {total} files")

    # Insert files in batches of 3 (small enough for reliable LLM calls)
    batch_size = 3
    for i in range(0, total, batch_size):
        batch = files[i:i+batch_size]
        texts = []
        paths = []

        for fpath in batch:
            try:
                content = fpath.read_text(encoding="utf-8", errors="replace")
            except:
                continue
            if not content or not content.strip():
                continue
            if len(content) > 100000:
                content = content[:80000] + "...[truncated]"
            rel = str(fpath.relative_to(P))
            texts.append(f"---FILE:{rel}---\n{content}")
            paths.append(f"batch_{i}:{rel}")

        if not texts:
            continue

        combined = "\n\n".join(texts)
        fp_rel = f"batch{i}-{i+len(batch)}"

        try:
            rel_names = ", ".join([f.name for f in batch])
            print(f"[{i}/{total}] Indexing: {rel_names} ({len(combined):,} chars)", flush=True)
            await rag.ainsert(combined, file_paths=[fp_rel])
            print(f"  -> OK", flush=True)
        except Exception as e:
            print(f"  -> Error: {e}", flush=True)

    # Git log
    try:
        r = subprocess.run(["git", "log", "--pretty=format:%h %ad %s", "--date=short", "-50"],
                          capture_output=True, text=True, cwd=P, timeout=10)
        if r.stdout:
            print(f"[{total}/{total}] Indexing git log", flush=True)
            await rag.ainsert(r.stdout, file_paths=["git-log"])
            print(f"  -> OK", flush=True)
    except Exception as e:
        print(f"  Git log: {e}", flush=True)

    # Report
    sfiles = sorted(os.listdir(WORKING_DIR)) if os.path.exists(WORKING_DIR) else []
    print(f"\n=== Done ===")
    print(f"Storage files: {len(sfiles)}")
    for fn in sfiles:
        fp = os.path.join(WORKING_DIR, fn)
        sz = os.path.getsize(fp)
        print(f"  {fn} ({sz:,} bytes)")


if __name__ == "__main__":
    asyncio.run(main())

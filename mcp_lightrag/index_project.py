#!/usr/bin/env python3
"""
Index all GoldPC project knowledge into LightRAG.

Auto-discovers all services and indexes:
- Markdown/docs at project root
- All backend services (.cs files)
- Frontend source (.ts, .tsx)
- Docker, CI/CD, contracts, dev plan
- Git commit history
- Memory files
"""

import asyncio
import os
import sys
from pathlib import Path

import warnings
warnings.filterwarnings("ignore")

# Force CPU to avoid GPU OOM with BGE-m3
os.environ["CUDA_VISIBLE_DEVICES"] = ""

_project_root = Path(__file__).parent.parent

from dotenv import load_dotenv
load_dotenv(_project_root / ".env", override=False)

WORKING_DIR = os.getenv("LIGHTRAG_WORKING_DIR", str(_project_root / ".rag-store"))
LLM_MODEL = os.getenv("LIGHTRAG_LLM_MODEL", "gpt-4o-mini")
EMBEDDING_MODEL = os.getenv("LIGHTRAG_EMBEDDING_MODEL", "BAAI/bge-m3")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "")
USE_LOCAL_EMBEDDING = os.getenv("LIGHTRAG_USE_LOCAL_EMBEDDING", "0") == "1"

os.makedirs(WORKING_DIR, exist_ok=True)


def _build_llm_func():
    from lightrag.llm.openai import openai_complete_if_cache
    from functools import partial
    kwargs = {"model": LLM_MODEL}
    if OPENAI_BASE_URL:
        kwargs["base_url"] = OPENAI_BASE_URL
    return partial(openai_complete_if_cache, **kwargs)


def _build_embed_func():
    if USE_LOCAL_EMBEDDING:
        from server import _build_local_embedding
        return _build_local_embedding(EMBEDDING_MODEL)
    from lightrag.llm.openai import openai_embed
    from functools import partial
    if OPENAI_BASE_URL:
        return partial(openai_embed, model=EMBEDDING_MODEL, base_url=OPENAI_BASE_URL)
    return partial(openai_embed, model=EMBEDDING_MODEL)


ALWAYS_EXCLUDED = frozenset(["node_modules", ".git", "venv", ".venv", "obj", "bin", "dist", "build", ".next", "coverage", ".turbo"])


def find_matching_files(directory, extensions, excludes, explicit_files=None):
    """Find files matching extensions, excluding directories with given names.

    If explicit_files is provided, skips walk and uses these exact files.
    """
    if explicit_files:
        return [f for f in explicit_files if f.exists()]

    all_excludes = ALWAYS_EXCLUDED | set(e for e in excludes if e)
    files = []
    directory = Path(directory)
    if not directory.exists():
        return files

    for root, dirs, filenames in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in all_excludes and not d.startswith("agent-")]

        for fn in sorted(filenames):
            if any(fn.endswith(ext) for ext in extensions):
                files.append(Path(root) / fn)

    return files


def discover_services():
    """Auto-discover all .NET services in src/."""
    src = _project_root / "src"
    if not src.exists():
        return []

    services = []
    for d in sorted(src.iterdir()):
        if d.is_dir() and (d / "Program.cs").exists():
            services.append((f"Service: {d.name}", d, [".cs", ".json"], []))

    return services


def discover_frontend():
    """Auto-discover frontend directories."""
    frontend = _project_root / "src" / "frontend"
    if frontend.exists():
        return [("Frontend (src/frontend)", frontend, [".ts", ".tsx", ".css"], [])]
    return []


def build_index_plan():
    """Build list of things to index."""
    plan = []

    # Root documentation: only top-level .md files (no recursion)
    root_md_files = [f for f in _project_root.glob("*.md") if f.is_file() and f.parent == _project_root and not f.name.startswith(".")]
    if root_md_files:
        plan.append(("Root documentation (README, AGENTS, etc.)", _project_root, [".md"], [], root_md_files))

    # Subdirectories
    sub_dirs = [
        ("docker", "Docker configs", ".yml,.yaml,.conf,.sh,Dockerfile"),
        ("contracts", "Contracts/ADR", ".md,.yml,.yaml,.json"),
        ("development-plan", "Development plan", ".md"),
        ("knowledge-base", "Knowledge base", ".md,.txt"),
        ("infrastructure", "Infrastructure", ".tf,.yml,.yaml,.sh,.json"),
        ("scripts", "Scripts", ".sh,.ps1,.py"),
    ]

    for dirname, desc, exts_str in sub_dirs:
        dirpath = _project_root / dirname
        if dirpath.exists():
            plan.append((desc, dirpath, exts_str.split(","), []))

    # GitHub CI/CD
    github_dir = _project_root / ".github"
    if github_dir.exists():
        plan.append(("GitHub CI/CD", github_dir, [".yml", ".yaml", ".sh"], []))

    # Memory/config — just settings and worktree root md (not agent worktrees)
    claude_settings = list(_project_root.glob(".claude/*.json"))
    claude_md = list(_project_root.glob(".claude/*.md"))
    if claude_settings or claude_md:
        plan.append(("Claude config", _project_root / ".claude", [".md", ".json"], ["worktrees"]))

    # Backend services (auto-discover)
    plan.extend(discover_services())

    # Frontend
    plan.extend(discover_frontend())

    # Shared libraries
    shared = _project_root / "src" / "Shared"
    if shared.exists():
        plan.append(("Shared library", shared, [".cs", ".json", ".csproj"], ["obj", "bin"]))
    shared_kernel = _project_root / "src" / "SharedKernel"
    if shared_kernel.exists():
        plan.append(("SharedKernel library", shared_kernel, [".cs", ".json", ".csproj"], ["obj", "bin"]))

    # Tests
    tests = _project_root / "tests"
    if tests.exists():
        plan.append(("Tests", tests, [".cs", ".py"], ["obj", "bin", "node_modules"]))

    return plan


async def index_directory_batch(rag, description, files, max_chars=30000):
    """Index files in batches by size limit."""
    total_files = 0
    total_chars = 0
    batch_text = ""
    batch_names = []

    for fpath in files:
        try:
            content = fpath.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue

        if not content.strip():
            continue

        # Truncate very large files
        if len(content) > 100000:
            content = content[:80000] + "\n... [truncated for indexing]"

        rel_path = str(fpath.relative_to(_project_root))
        chunk = f"---FILE:{rel_path}---\n{content}\n\n"

        if len(batch_text) + len(chunk) > max_chars and batch_text:
            await rag.ainsert(batch_text, file_paths=[description])
            total_files += len(batch_names)
            total_chars += len(batch_text)
            print(f"    [{description}] Indexed {batch_names[0]} .. {batch_names[-1]} ({len(batch_names)} files)")
            batch_text = ""
            batch_names = []

        batch_text += chunk
        batch_names.append(fpath.name)

    if batch_text:
        await rag.ainsert(batch_text, file_paths=[description])
        total_files += len(batch_names)
        total_chars += len(batch_text)
        if len(batch_names) > 1:
            print(f"    [{description}] Indexed {batch_names[0]} .. {batch_names[-1]} ({len(batch_names)} files)")
        else:
            print(f"    [{description}] Indexed {batch_names[0]} (1 file)")

    return total_files, total_chars


async def main():
    import subprocess
    from lightrag import LightRAG

    llm_func = _build_llm_func()
    embed_func = _build_embed_func()

    print(f"Initializing LightRAG in {WORKING_DIR}")
    print(f"  LLM: {LLM_MODEL}, Embedding: {EMBEDDING_MODEL}")

    rag = LightRAG(
        working_dir=WORKING_DIR,
        llm_model_func=llm_func,
        embedding_func=embed_func,
    )
    await rag.initialize_storages()

    grand_total_files = 0
    grand_total_chars = 0

    # 1. Git log
    try:
        result = subprocess.run(
            ["git", "log", "--pretty=format:%h %ad %s\n%b", "--date=short", "-50"],
            capture_output=True, text=True, cwd=_project_root, timeout=10
        )
        if result.stdout.strip():
            print("[1/{}] Indexing git log (50 recent commits)".format(len(build_index_plan()) + 2))
            await rag.ainsert(result.stdout, file_paths=["git-log-50-commits"])
            print(f"  OK ({len(result.stdout):,} chars)")
            grand_total_chars += len(result.stdout)
    except Exception as e:
        print(f"  Git log indexing failed: {e}")

    # 2. Index directories
    plan = build_index_plan()
    total_steps = len(plan) + 1  # +1 for git log

    for i, item in enumerate(plan, 2):
        if len(item) == 5:
            desc, dirpath, exts, excludes, explicit_files = item
        else:
            desc, dirpath, exts, excludes = item
            explicit_files = None

        files = find_matching_files(dirpath, exts, excludes, explicit_files)
        if not files:
            print(f"[{i}/{total_steps}] [{desc}] - no matching files")
            continue

        print(f"[{i}/{total_steps}] [{desc}] - {len(files)} files")
        nf, nc = await index_directory_batch(rag, desc, files)
        grand_total_files += nf
        grand_total_chars += nc

    # 3. Report
    storage_files = sorted(os.listdir(WORKING_DIR)) if os.path.exists(WORKING_DIR) else []
    print(f"\n=== Indexing Complete ===")
    print(f"Total files indexed: {grand_total_files}")
    print(f"Total chars indexed: {grand_total_chars:,}")
    print(f"Storage files ({len(storage_files)}):")
    for f_name in storage_files:
        fpath = os.path.join(WORKING_DIR, f_name)
        size = os.path.getsize(fpath)
        print(f"  - {f_name} ({size:,} bytes)")


if __name__ == "__main__":
    asyncio.run(main())

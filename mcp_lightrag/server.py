#!/usr/bin/env python3
"""
LightRAG MCP Server - stdio-based MCP server for GoldPC project.

Provides 3 tools:
  1. rag_query(query, mode) - query the knowledge graph
  2. rag_insert(document_text, file_path) - index a document
  3. rag_status() - check indexed documents and storage status
"""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path
from typing import Optional

# Force CPU to avoid GPU OOM with BGE-m3
os.environ["CUDA_VISIBLE_DEVICES"] = ""

from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv

# Resolve .env in project root
_project_root = Path(__file__).parent.parent
load_dotenv(_project_root / ".env", override=False)
load_dotenv(Path.home() / ".env", override=False)  # fallback

WORKING_DIR = os.getenv("LIGHTRAG_WORKING_DIR", str(_project_root / ".rag-store"))
LLM_MODEL = os.getenv("LIGHTRAG_LLM_MODEL", "gpt-4o-mini")
EMBEDDING_MODEL = os.getenv("LIGHTRAG_EMBEDDING_MODEL", "text-embedding-3-small")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "")  # for compatible APIs (OpenRouter, etc.)

# Ensure working dir exists
os.makedirs(WORKING_DIR, exist_ok=True)

# Configure logging to file (stderr goes to MCP transport)
_log_dir = _project_root / "logs"
_log_dir.mkdir(exist_ok=True)
_log_file = _log_dir / "lightrag_mcp.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.handlers.RotatingFileHandler(
            _log_file, maxBytes=5 * 1024 * 1024, backupCount=2, encoding="utf-8"
        ),
    ],
)
logger = logging.getLogger("lightrag_mcp")

# ─── Lazy LightRAG init ───────────────────────────────────────────────────
_rag = None
_rag_lock = asyncio.Lock()


def _build_llm_func():
    """Build the LLM function for LightRAG based on config."""
    from lightrag.llm.openai import openai_complete_if_cache
    from functools import partial
    kwargs = {"model": LLM_MODEL}
    if OPENAI_BASE_URL:
        kwargs["base_url"] = OPENAI_BASE_URL
    return partial(openai_complete_if_cache, **kwargs)


def _build_embed_func():
    """Build the embedding function for LightRAG.

    Strategy:
    1. If LIGHTRAG_USE_LOCAL_EMBEDDING=1 → use local sentence-transformers BGE-m3
    2. If OPENAI_BASE_URL → use remote embedding via OpenAI-compatible API
    3. Default → use OpenAI text-embedding-3-small
    """
    from functools import partial

    use_local = os.getenv("LIGHTRAG_USE_LOCAL_EMBEDDING", "0") == "1"

    if use_local:
        logger.info(f"Using local embedding: {EMBEDDING_MODEL}")
        return _build_local_embedding(EMBEDDING_MODEL)

    from lightrag.llm.openai import openai_embed
    if OPENAI_BASE_URL:
        logger.info(f"Using remote embedding: {EMBEDDING_MODEL} via {OPENAI_BASE_URL}")
        return partial(openai_embed, model=EMBEDDING_MODEL, base_url=OPENAI_BASE_URL)
    return partial(openai_embed, model=EMBEDDING_MODEL)


_local_embed_cache: dict = {}


async def _local_embed_call(texts: list[str], model_ref: str = "model", **kwargs) -> "np.ndarray":
    """Inner async function that does the actual embedding."""
    import numpy as np
    model = _local_embed_cache.get(model_ref)
    if model is None:
        model = _load_local_model(_local_embed_cache.get("__model_name__", "BAAI/bge-m3"))
        _local_embed_cache["model"] = model
    embeddings = model.encode(texts, show_progress_bar=False, normalize_embeddings=True)
    return embeddings.astype(np.float32)


def _load_local_model(model_name: str):
    from sentence_transformers import SentenceTransformer
    logger.info(f"Loading local embedding model: {model_name}")
    return SentenceTransformer(model_name, trust_remote_code=True)


def _build_local_embedding(embedding_model: str = "BAAI/bge-m3"):
    """Build an EmbeddingFunc-compatible local embedding using sentence-transformers."""
    from lightrag.utils import EmbeddingFunc
    global _local_embed_cache

    if not _local_embed_cache:
        model = _load_local_model(embedding_model)
        dim = model.get_sentence_embedding_dimension()
        _local_embed_cache["model"] = model
        _local_embed_cache["embed_dim"] = dim

    embedding_dim = _local_embed_cache["embed_dim"]

    async def do_embed(texts: list[str]) -> "np.ndarray":
        import numpy as np
        model = _local_embed_cache["model"]
        embeddings = model.encode(texts, show_progress_bar=False, normalize_embeddings=True)
        return embeddings

    return EmbeddingFunc(
        embedding_dim=embedding_dim,
        model_name=f"local_{embedding_model}",
        func=do_embed,
    )


async def _get_rag():
    """Lazy singleton initialization of LightRAG."""
    global _rag
    if _rag is not None:
        return _rag

    async with _rag_lock:
        if _rag is not None:
            return _rag

        from lightrag import LightRAG

        llm_func = _build_llm_func()
        embed_func = _build_embed_func()

        logger.info(f"Initializing LightRAG in {WORKING_DIR}")
        logger.info(f"  LLM: {LLM_MODEL}, Embedding: {EMBEDDING_MODEL}")

        _rag = LightRAG(
            working_dir=WORKING_DIR,
            llm_model_func=llm_func,
            embedding_func=embed_func,
        )
        await _rag.initialize_storages()
        logger.info("LightRAG initialized successfully")

    return _rag


# ─── MCP Server ───────────────────────────────────────────────────────────
mcp = FastMCP(
    name="GoldPC-RAG",
    instructions=(
        "GoldPC project knowledge graph via LightRAG. "
        "Use rag_query to search indexed knowledge, "
        "rag_insert to index new text, "
        "rag_status to see what's indexed."
    ),
)


@mcp.tool()
async def rag_query(
    query: str,
    mode: str = "hybrid",
) -> str:
    """Query the project knowledge graph.

    Args:
        query: The question or search query about the GoldPC project
        mode: Query mode - one of: naive, local, global, hybrid (default: hybrid)

    Returns:
        The answer from the knowledge graph based on indexed project knowledge
    """
    try:
        rag = await _get_rag()
        from lightrag import QueryParam
        param = QueryParam(mode=mode)
        result = await rag.aquery(query, param=param)
        return str(result)
    except Exception as e:
        logger.exception("Query failed")
        return f"Query error: {e}"


@mcp.tool()
async def rag_insert(
    document_text: str,
    file_path: str = "manual-entry",
) -> str:
    """Insert a document into the knowledge graph for future queries.

    Args:
        document_text: The text content to index
        file_path: Identifier for the source (e.g. git-commit:abc123, path/to/file.py)

    Returns:
        Confirmation of indexing completion
    """
    try:
        rag = await _get_rag()
        await rag.ainsert(document_text, file_paths=[file_path])
        logger.info(f"Indexed document: {file_path} ({len(document_text)} chars)")
        return f"Successfully indexed '{file_path}' ({len(document_text)} characters)"
    except Exception as e:
        logger.exception("Indexing failed")
        return f"Indexing error: {e}"


@mcp.tool()
async def rag_status() -> str:
    """Check the status of the knowledge graph: indexed documents and storage stats.

    Returns:
        Status report showing what documents are indexed and storage statistics
    """
    try:
        rag = await _get_rag()
        from lightrag import QueryParam

        # Get doc status
        status = rag.doc_status
        docs = []
        if hasattr(status, 'docs') and status.docs:
            docs = list(status.docs.values())

        # Get storage files
        files = sorted(os.listdir(WORKING_DIR)) if os.path.exists(WORKING_DIR) else []

        report = []
        report.append(f"=== LightRAG Knowledge Base Status ===")
        report.append(f"Working dir: {WORKING_DIR}")
        report.append(f"Indexed documents: {len(docs)}")

        for doc in docs[:50]:  # Show up to 50
            report.append(f"  - {doc.get('file_path', 'unknown')} "
                          f"(status: {doc.get('status', '?')}, "
                          f"chunks: {doc.get('chunks_count', '?')})")

        report.append(f"\nStorage files ({len(files)}):")
        for f_name in files:
            fpath = os.path.join(WORKING_DIR, f_name)
            size = os.path.getsize(fpath)
            report.append(f"  - {f_name} ({size:,} bytes)")

        if not docs:
            report.append("\nNo documents indexed yet. Use rag_insert to add knowledge.")

        report.append(f"\n=== End Status ===")
        return "\n".join(report)
    except Exception as e:
        logger.exception("Status check failed")
        return f"Status error: {e}"


# ─── Entry point ──────────────────────────────────────────────────────────
def main():
    logger.info("Starting LightRAG MCP Server (stdio)")
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()

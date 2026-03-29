#!/usr/bin/env python3
"""MCP server: HTTP probes for local GoldPC-style APIs (ports 8080+ on localhost)."""

from __future__ import annotations

import os
import time
from typing import Any

import httpx
from mcp.server.fastmcp import FastMCP

DEFAULT_PORTS = [9081, 9082, 9090, 3000, 3002]


def _parse_ports() -> list[int]:
    raw = os.getenv("GOLDPC_MCP_PORTS", "")
    if raw.strip():
        return [int(p.strip()) for p in raw.split(",") if p.strip().isdigit()]
    return list(DEFAULT_PORTS)


mcp = FastMCP("GoldPC API probe")


async def _probe_http(
    port: int,
    path: str = "/",
    timeout_seconds: float = 3.0,
) -> dict[str, Any]:
    url = f"http://127.0.0.1:{port}{path if path.startswith('/') else '/' + path}"
    try:
        async with httpx.AsyncClient(timeout=timeout_seconds) as client:
            start = time.perf_counter()
            r = await client.get(url, follow_redirects=True)
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            text = (r.text or "")[:500]
            return {
                "ok": True,
                "url": str(r.url),
                "status_code": r.status_code,
                "latency_ms": elapsed_ms,
                "body_preview": text,
            }
    except Exception as e:
        return {"ok": False, "url": url, "error": str(e)}


@mcp.tool()
async def probe_port(
    port: int,
    path: str = "/",
    timeout_seconds: float = 3.0,
) -> dict[str, Any]:
    """GET http://127.0.0.1:{port}{path} and return status, latency_ms, snippet."""
    return await _probe_http(port, path, timeout_seconds)


@mcp.tool()
async def probe_default_services() -> dict[str, Any]:
    """Probe GOLDPC_MCP_PORTS or default host ports (catalog, auth, adminer, frontends)."""
    results: dict[str, Any] = {}
    for port in _parse_ports():
        results[str(port)] = await _probe_http(port, path="/")
    return {"ports": _parse_ports(), "results": results}


def main() -> None:
    mcp.run()


if __name__ == "__main__":
    main()

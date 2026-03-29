#!/usr/bin/env python3
"""CDP smoke test: connect, open URL, screenshot (base64), print console-related state."""

from __future__ import annotations

import asyncio
import base64
import json
import os
import sys

_REPO = "/home/goldie/mcp-servers/chrome-devtools-mcp"
os.environ.setdefault("CHROME_DEBUG_PORT", "9222")

# Load src.client without executing src/__init__.py (avoids FastMCP + stray LOG_LEVEL).
import importlib.util
import types

_src = types.ModuleType("src")
_src.__path__ = [f"{_REPO}/src"]
sys.modules["src"] = _src
_tools = types.ModuleType("src.tools")
_tools.__path__ = [f"{_REPO}/src/tools"]
sys.modules["src.tools"] = _tools

_utils_spec = importlib.util.spec_from_file_location(
    "src.tools.utils", f"{_REPO}/src/tools/utils.py"
)
_utils = importlib.util.module_from_spec(_utils_spec)
assert _utils_spec.loader
sys.modules["src.tools.utils"] = _utils
_utils_spec.loader.exec_module(_utils)

_client_spec = importlib.util.spec_from_file_location(
    "src.client", f"{_REPO}/src/client.py"
)
_client_mod = importlib.util.module_from_spec(_client_spec)
assert _client_spec.loader
sys.modules["src.client"] = _client_mod
_client_spec.loader.exec_module(_client_mod)
ChromeDevToolsClient = _client_mod.ChromeDevToolsClient


async def main() -> None:
    url = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3000/"
    client = ChromeDevToolsClient(port=9222)
    ok = await client.connect()
    if not ok:
        print(json.dumps({"error": "connect_failed"}, indent=2))
        sys.exit(1)
    await client.enable_domains()
    await client.send_command("Page.navigate", {"url": url})
    await asyncio.sleep(2)
    shot = await client.send_command("Page.captureScreenshot", {"format": "png"})
    data = shot.get("data", "")
    out_path = "/tmp/goldpc-cdp-screenshot.png"
    with open(out_path, "wb") as f:
        f.write(base64.b64decode(data))
    print("Screenshot:", out_path, "bytes=", len(base64.b64decode(data)))
    print("Console log entries captured:", len(client.console_logs))
    for i, entry in enumerate(client.console_logs[:20]):
        print(json.dumps(entry, ensure_ascii=False)[:500])
    await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())

#!/usr/bin/env bash
# Launcher for LightRAG MCP server
# Called by Claude Code as the MCP stdio transport
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_PYTHON="${SCRIPT_DIR}/.venv/bin/python"

exec "${VENV_PYTHON}" "${SCRIPT_DIR}/server.py"

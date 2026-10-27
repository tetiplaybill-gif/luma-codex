#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
NODE='/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node'
if [ ! -x "$NODE" ]; then NODE="$(command -v node || true)"; fi
if [ -z "$NODE" ]; then printf '未找到 Node.js。请安装 Node.js 18 或更新版本后再试。\n' >&2; exit 1; fi
exec "$NODE" "$ROOT/src/launcher.cjs" "$@"

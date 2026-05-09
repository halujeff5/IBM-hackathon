#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/backend"

if [ ! -x ".venv/bin/python" ]; then
  python3 -m venv .venv
fi

.venv/bin/python -m pip install -r requirements.txt
exec .venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8001

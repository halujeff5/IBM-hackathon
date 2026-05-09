# Backend

FastAPI service for reading local Formula 1 telemetry data.

The service loads sample lap data from `../data/lapdata/`.

```bash
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8001
```

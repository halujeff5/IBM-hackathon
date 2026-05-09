# F1 Racing IBM

This workspace is organized as a small full-stack project:

- `frontend/` - Next.js app
- `backend/` - FastAPI service
- `data/` - local Formula 1 telemetry and lap data
- `docs/` - project reference documentation

## Backend

```bash
./run-backend.sh
```

Or manually:

```bash
cd backend
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8001
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the backend to be running on `http://127.0.0.1:8001`.

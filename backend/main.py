import asyncio
import json
import pickle
import re
from pathlib import Path

import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000", "http://localhost:3000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

PROJECT_ROOT = Path(__file__).resolve().parents[1]
LAP_DATA_DIR = PROJECT_ROOT / "data" / "lapdata"
LAP_COUNT = 57
TELEMETRY_COLUMNS = ["time", "distance"]
LAP_FILE_PATTERN = re.compile(r"^([A-Z]{3})lap(\d+)\.pkl$")


def discover_drivers() -> list[str]:
    drivers = {}
    for path in LAP_DATA_DIR.glob("*lap*.pkl"):
        match = LAP_FILE_PATTERN.match(path.name)
        if match:
            drivers.setdefault(match.group(1), set()).add(int(match.group(2)))

    return [
        driver
        for driver, laps in sorted(drivers.items())
        if all(lap_number in laps for lap_number in range(1, LAP_COUNT + 1))
    ]


DRIVERS = discover_drivers()


def lap_path(driver: str, lap_number: int) -> Path:
    nested_path = LAP_DATA_DIR / driver / f"{driver}lap{lap_number}.pkl"
    if nested_path.exists():
        return nested_path

    return LAP_DATA_DIR / f"{driver}lap{lap_number}.pkl"


def load_lap(driver: str, lap_number: int) -> pd.DataFrame:
    with lap_path(driver, lap_number).open("rb") as f:
        return pickle.load(f)


def serialize_driver_lap(driver: str, lap_number: int) -> dict:
    lap_data = load_lap(driver, lap_number)
    return {
        "name": driver,
        "lap": lap_number,
        "points": lap_data[TELEMETRY_COLUMNS].to_dict(orient="records"),
    }


def serialize_lap(lap_number: int) -> dict:
    return {
        "lap": lap_number,
        "drivers": [
            serialize_driver_lap(driver, lap_number)
            for driver in DRIVERS
        ],
    }


@app.get("/")
async def fetch_race():
    return {
        "laps": LAP_COUNT,
        "drivers": DRIVERS,
        "streamUrl": "/laps/stream",
    }


@app.get("/laps/stream")
async def stream_laps():
    async def generate():
        for lap_number in range(1, LAP_COUNT + 1):
            payload = serialize_lap(lap_number)
            yield f"data: {json.dumps(payload)}\n\n"
            await asyncio.sleep(0.15)

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.get("/laps/metadata")
async def fetch_lap_metadata():
    return {
        "drivers": [
            {
                "name": driver,
                "laps": [
                    {
                        "lap": lap_number,
                        "maxDistance": float(
                            load_lap(driver, lap_number)["distance"].max()
                        ),
                    }
                    for lap_number in range(1, LAP_COUNT + 1)
                ],
            }
            for driver in DRIVERS
        ],
    }


@app.get("/laps/{lap_number}")
async def fetch_lap(lap_number: int):
    return serialize_lap(lap_number)

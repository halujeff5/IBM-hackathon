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
LAP_DATA_DIR = PROJECT_ROOT / "data" / "allData"
LAP_COUNT = 57
TELEMETRY_COLUMNS = ["time", "distance", "speed", "brake", "gear", "throttle", "x", "y"]
LAP_FILE_PATTERN = re.compile(r"^([A-Z]{3})lap(\d+)\.pkl$")


def discover_lap_files() -> dict[str, dict[int, Path]]:
    lap_files: dict[str, dict[int, Path]] = {}

    for path in LAP_DATA_DIR.glob("*.pkl"):
        match = LAP_FILE_PATTERN.match(path.name)
        if not match:
            continue

        driver = path.name[:3]
        lap_number = int(match.group(2))
        lap_files.setdefault(driver, {})[lap_number] = path

    return lap_files


def discover_drivers(lap_files: dict[str, dict[int, Path]] | None = None) -> list[str]:
    return sorted(lap_files if lap_files is not None else discover_lap_files())


def lap_path(
    driver: str,
    lap_number: int,
    lap_files: dict[str, dict[int, Path]] | None = None,
) -> Path:
    driver_prefix = driver[:3].upper()

    return (lap_files if lap_files is not None else discover_lap_files())[driver_prefix][lap_number]


def load_lap(
    driver: str,
    lap_number: int,
    lap_files: dict[str, dict[int, Path]] | None = None,
) -> pd.DataFrame:
    with lap_path(driver, lap_number, lap_files).open("rb") as f:
        return pickle.load(f)


def serialize_driver_lap(
    driver: str,
    lap_number: int,
    lap_files: dict[str, dict[int, Path]],
) -> dict:
    if lap_number not in lap_files.get(driver, {}):
        return {
            "name": driver,
            "lap": lap_number,
            "active": False,
            "sourceFile": None,
            "points": [],
        }

    lap_data = load_lap(driver, lap_number, lap_files)
    telemetry_columns = [
        column for column in TELEMETRY_COLUMNS if column in lap_data.columns
    ]
    telemetry = lap_data[telemetry_columns].where(
        pd.notnull(lap_data[telemetry_columns]),
        None,
    )

    return {
        "name": driver,
        "lap": lap_number,
        "active": True,
        "sourceFile": lap_path(driver, lap_number, lap_files).name,
        "points": telemetry.to_dict(orient="records"),
    }


def serialize_lap(lap_number: int) -> dict:
    lap_files = discover_lap_files()
    drivers = discover_drivers(lap_files)

    return {
        "lap": lap_number,
        "drivers": [
            serialize_driver_lap(driver, lap_number, lap_files)
            for driver in drivers
        ],
    }


@app.get("/")
async def fetch_race():
    lap_files = discover_lap_files()

    return {
        "laps": LAP_COUNT,
        "drivers": discover_drivers(lap_files),
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
    lap_files = discover_lap_files()

    return {
        "drivers": [
            {
                "name": driver,
                "laps": [
                    {
                        "lap": lap_number,
                        "maxDistance": float(
                            load_lap(driver, lap_number, lap_files)["distance"].max()
                        ),
                    }
                    for lap_number in range(1, LAP_COUNT + 1)
                    if lap_number in lap_files.get(driver, {})
                ],
            }
            for driver in discover_drivers(lap_files)
        ],
    }


@app.get("/laps/{lap_number}")
async def fetch_lap(lap_number: int):
    return serialize_lap(lap_number)

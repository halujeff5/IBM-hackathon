import asyncio
import json
import pickle
import re
from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000", "http://localhost:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

PROJECT_ROOT = Path(__file__).resolve().parents[1]
LAP_DATA_DIR = PROJECT_ROOT / "data" / "allData"
PREDICTION_DATA_DIR = PROJECT_ROOT / "data" / "predictionData"
PREDICTION_MODEL_PATH = PROJECT_ROOT / "backend" / "models" / "xgb_ranker_last_10_laps.pkl"
ALL_LAPTIMES_POSITIONS_CSV = PREDICTION_DATA_DIR / "all_laptimes_positions.csv"

DRIVER_LAP_LAST_TIME_CSV = PROJECT_ROOT / "data" / "predictionData" / "driver_lap_last_time.csv"

LAP_COUNT = 57
TELEMETRY_COLUMNS = ["time", "distance", "speed", "brake", "gear", "throttle", "x", "y"]
LAP_FILE_PATTERN = re.compile(r"^([A-Z]{3})lap(\d+)\.pkl$")

PREDICTION_SIMULATION_COUNT = 10000
PREDICTION_TOP_N = 5
PREDICTION_CHECKPOINT_LAPS = [10, 20, 30, 40, 50, 52, 54, 56, 57]

POSITIONS_CSV_COLUMNS = [
    "driver",
    "lap",
    "pos",
    "life",
    "compound",
    "time",
    "avg_prev_3_time",
    "pace_delta",
]


class CompatStringDtype:
    def __init__(self, storage="python", na_value=None):
        self.storage = storage
        self.na_value = na_value


class CompatStringArray:
    dtype = object

    def __setstate__(self, state):
        self.values = state[1] if isinstance(state, tuple) and len(state) > 1 else []

    def __iter__(self):
        return iter(self.values)

    def __len__(self):
        return len(self.values)

    def __getitem__(self, index):
        return self.values[index]

    def __array__(self, dtype=None):
        return np.array(self.values, dtype=dtype or object)


def compat_unpickle_ndarray_backed(cls, checksum, state):
    if getattr(cls, "__name__", "") == "StringArray":
        return CompatStringArray()

    from pandas._libs.arrays import __pyx_unpickle_NDArrayBacked

    return __pyx_unpickle_NDArrayBacked(cls, checksum, state)


class TelemetryUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if module == "pandas._libs.arrays" and name == "__pyx_unpickle_NDArrayBacked":
            return compat_unpickle_ndarray_backed

        if module.startswith("pandas") and name == "StringDtype":
            return CompatStringDtype

        return super().find_class(module, name)


def discover_lap_files():
    lap_files = {}

    for path in LAP_DATA_DIR.glob("*.pkl"):
        match = LAP_FILE_PATTERN.match(path.name)

        if not match:
            continue

        driver = path.name[:3]
        lap_number = int(match.group(2))
        lap_files.setdefault(driver, {})[lap_number] = path

    return lap_files


def discover_drivers(lap_files=None):
    if lap_files is None:
        lap_files = discover_lap_files()

    return sorted(lap_files)


def lap_path(driver, lap_number, lap_files=None):
    if lap_files is None:
        lap_files = discover_lap_files()

    driver_prefix = driver[:3].upper()
    return lap_files[driver_prefix][lap_number]


@lru_cache(maxsize=None)
def load_lap_file(path):
    lap_path = Path(path)

    with lap_path.open("rb") as file:
        return TelemetryUnpickler(file).load()


def load_lap(driver, lap_number, lap_files=None):
    return load_lap_file(str(lap_path(driver, lap_number, lap_files)))


@lru_cache(maxsize=None)
def lap_distance_from_file(path):
    lap_data = load_lap_file(path)

    if "distance" not in lap_data.columns:
        return 0.0

    return float(pd.to_numeric(lap_data["distance"], errors="coerce").max() or 0)


def cumulative_distance_before_lap(driver, lap_number, lap_files):
    return sum(
        lap_distance_from_file(str(lap_files[driver][previous_lap]))
        for previous_lap in range(1, lap_number)
        if previous_lap in lap_files.get(driver, {})
    )


def serialize_driver_lap(driver, lap_number, lap_files):
    completed_distance = cumulative_distance_before_lap(driver, lap_number, lap_files)
    race_position = race_position_for_driver_lap(driver, lap_number)
    race_gap_seconds = race_gap_for_driver_lap(driver, lap_number)

    if lap_number not in lap_files.get(driver, {}):
        return {
            "name": driver,
            "lap": lap_number,
            "racePosition": race_position,
            "raceGapSeconds": race_gap_seconds,
            "active": False,
            "sourceFile": None,
            "completedDistance": completed_distance,
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

    if "distance" in telemetry.columns:
        telemetry["raceDistance"] = (
            pd.to_numeric(telemetry["distance"], errors="coerce")
            .fillna(0)
            .clip(lower=0)
            + completed_distance
        )

    return {
        "name": driver,
        "lap": lap_number,
        "racePosition": race_position,
        "raceGapSeconds": race_gap_seconds,
        "active": True,
        "sourceFile": lap_path(driver, lap_number, lap_files).name,
        "completedDistance": completed_distance,
        "points": telemetry.to_dict(orient="records"),
    }


def serialize_lap(lap_number):
    lap_files = discover_lap_files()
    drivers = discover_drivers(lap_files)

    return {
        "lap": lap_number,
        "drivers": [
            serialize_driver_lap(driver, lap_number, lap_files)
            for driver in drivers
        ],
    }


@lru_cache(maxsize=1)
def race_positions_by_lap_driver():
    positions_df = load_all_laptimes_positions_csv()

    return {
        (int(row.lap), str(row.driver)): int(row.pos)
        for row in positions_df.itertuples(index=False)
        if pd.notnull(row.pos)
    }


def race_position_for_driver_lap(driver, lap_number):
    return race_positions_by_lap_driver().get((lap_number, driver))


@lru_cache(maxsize=1)
def race_gaps_by_lap_driver():
    if not DRIVER_LAP_LAST_TIME_CSV.exists():
        return {}

    timing_df = pd.read_csv(DRIVER_LAP_LAST_TIME_CSV)

    required_columns = {"driver", "lap", "last_time"}
    if not required_columns.issubset(timing_df.columns):
        return {}

    timing_df = timing_df[["driver", "lap", "last_time"]].copy()
    timing_df["driver"] = timing_df["driver"].astype(str)
    timing_df["lap"] = pd.to_numeric(timing_df["lap"], errors="coerce")
    timing_df["last_time"] = pd.to_numeric(timing_df["last_time"], errors="coerce")
    timing_df = timing_df.dropna(subset=["driver", "lap", "last_time"])

    timing_df = timing_df.sort_values(["driver", "lap"])
    timing_df["elapsed_time"] = timing_df.groupby("driver")["last_time"].cumsum()
    timing_df["leader_elapsed_time"] = timing_df.groupby("lap")[
        "elapsed_time"
    ].transform("min")
    timing_df["gap_seconds"] = (
        timing_df["elapsed_time"] - timing_df["leader_elapsed_time"]
    )

    return {
        (int(row.lap), str(row.driver)): round(float(row.gap_seconds), 3)
        for row in timing_df.itertuples(index=False)
    }


def race_gap_for_driver_lap(driver, lap_number):
    return race_gaps_by_lap_driver().get((lap_number, driver))


@lru_cache(maxsize=1)
def load_ranker_model():
    with PREDICTION_MODEL_PATH.open("rb") as file:
        return pickle.load(file)


def ranker_feature_frame(pace_df, feature_names):
    features = pd.DataFrame(index=pace_df.index)

    for feature_name in feature_names:
        if feature_name.startswith("drv_"):
            features[feature_name] = (
                pace_df["driver"].astype(str) == feature_name.removeprefix("drv_")
            ).astype(int)

        elif feature_name.startswith("compound_"):
            features[feature_name] = (
                pace_df["compound"].astype(str)
                == feature_name.removeprefix("compound_")
            ).astype(int)

        else:
            features[feature_name] = pd.to_numeric(
                pace_df.get(feature_name),
                errors="coerce",
            )

    return features.fillna(0)


def normalize_positions_dataframe(positions_df):
    missing_columns = [
        column for column in POSITIONS_CSV_COLUMNS if column not in positions_df.columns
    ]

    if missing_columns:
        raise ValueError(
            f"{ALL_LAPTIMES_POSITIONS_CSV} is missing columns: {missing_columns}"
        )

    return (
        positions_df[POSITIONS_CSV_COLUMNS]
        .sort_values(["lap", "pos", "driver"])
        .reset_index(drop=True)
    )


def load_all_laptimes_positions_csv():
    if not ALL_LAPTIMES_POSITIONS_CSV.exists():
        raise FileNotFoundError(
            f"Prediction CSV not found: {ALL_LAPTIMES_POSITIONS_CSV}"
        )

    positions_df = normalize_positions_dataframe(
        pd.read_csv(ALL_LAPTIMES_POSITIONS_CSV)
    )

    positions_df["lap"] = pd.to_numeric(positions_df["lap"], errors="coerce")
    positions_df["pos"] = pd.to_numeric(positions_df["pos"], errors="coerce")
    positions_df["time"] = pd.to_numeric(positions_df["time"], errors="coerce")
    positions_df["life"] = pd.to_numeric(positions_df["life"], errors="coerce")
    positions_df["avg_prev_3_time"] = pd.to_numeric(
        positions_df["avg_prev_3_time"],
        errors="coerce",
    )
    positions_df["pace_delta"] = pd.to_numeric(
        positions_df["pace_delta"],
        errors="coerce",
    )

    return positions_df.dropna(subset=["driver", "lap", "time"]).reset_index(drop=True)


def predict_rank_probability_with_model(
    positions_df,
    n_sims=PREDICTION_SIMULATION_COUNT,
    seed=42,
    input_lap_count=10,
    target_lap=None,
):
    model = load_ranker_model()
    feature_names = list(model.feature_names_in_)

    pace_df = positions_df.copy()

    if target_lap is not None:
        pace_df = pace_df[pace_df["lap"] <= target_lap]

    recent_laps = (
        pace_df.sort_values(["driver", "lap"])
        .groupby("driver", group_keys=False)
        .tail(input_lap_count)
        .copy()
    )

    if recent_laps.empty:
        raise ValueError("No laptimes available for ranker prediction.")

    features = ranker_feature_frame(recent_laps, feature_names)
    recent_laps["rank_score"] = model.predict(features)

    driver_scores = recent_laps.groupby("driver")["rank_score"].mean().sort_index()

    drivers = driver_scores.index.to_numpy()
    scores = driver_scores.to_numpy(dtype=float)

    rng = np.random.default_rng(seed + int(target_lap or 0))

    sampled_scores = scores[None, :] + rng.gumbel(
        loc=0,
        scale=1,
        size=(n_sims, len(drivers)),
    )

    order = np.argsort(-sampled_scores, axis=1)
    ranks = np.empty_like(order)

    for sim_index in range(n_sims):
        ranks[sim_index, order[sim_index]] = np.arange(1, len(drivers) + 1)

    rank_probability = pd.DataFrame({"driver": drivers})
    rank_probability["rank_score"] = scores
    rank_probability["win_prob"] = (ranks == 1).mean(axis=0)
    rank_probability["second_prob"] = (ranks == 2).mean(axis=0)
    rank_probability["third_prob"] = (ranks == 3).mean(axis=0)
    rank_probability["top_3_prob"] = (ranks <= 3).mean(axis=0)
    rank_probability[f"top_{PREDICTION_TOP_N}_prob"] = (
        ranks <= PREDICTION_TOP_N
    ).mean(axis=0)
    rank_probability["expected_finish"] = ranks.mean(axis=0)

    return (
        rank_probability.sort_values(["expected_finish", "driver"])
        .reset_index(drop=True)
    )


def fetch_rank_probability():
    return predict_rank_probability_with_model(load_all_laptimes_positions_csv())


def fetch_rank_probability_for_lap(lap_number):
    return predict_rank_probability_with_model(
        load_all_laptimes_positions_csv(),
        target_lap=lap_number,
    )


def fetch_rank_probability_checkpoints():
    positions_df = load_all_laptimes_positions_csv()

    return {
        lap_number: predict_rank_probability_with_model(
            positions_df,
            target_lap=lap_number,
        )
        for lap_number in PREDICTION_CHECKPOINT_LAPS
    }


def serialize_rank_probability(rank_probability):
    return rank_probability.where(pd.notnull(rank_probability), None).to_dict(
        orient="records"
    )


@app.get("/")
async def fetch_race():
    lap_files = discover_lap_files()

    return {
        "laps": LAP_COUNT,
        "drivers": discover_drivers(lap_files),
        "streamUrl": "/laps/stream",
        "predictionStreamUrl": "/predictions/stream",
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


@app.get("/predictions")
async def fetch_predictions():
    checkpoint_probabilities = await asyncio.to_thread(
        fetch_rank_probability_checkpoints
    )

    final_lap = PREDICTION_CHECKPOINT_LAPS[-1]

    return {
        "source": str(ALL_LAPTIMES_POSITIONS_CSV),
        "sourceType": "all_laptimes_positions_csv",
        "model": str(PREDICTION_MODEL_PATH),
        "simulations": PREDICTION_SIMULATION_COUNT,
        "checkpointLaps": PREDICTION_CHECKPOINT_LAPS,
        "csv": str(ALL_LAPTIMES_POSITIONS_CSV),
        "drivers": serialize_rank_probability(checkpoint_probabilities[final_lap]),
        "checkpoints": {
            str(lap_number): serialize_rank_probability(rank_probability)
            for lap_number, rank_probability in checkpoint_probabilities.items()
        },
    }


@app.get("/predictions/{lap_number}")
async def fetch_predictions_for_lap(lap_number: int):
    rank_probability = await asyncio.to_thread(
        fetch_rank_probability_for_lap,
        lap_number,
    )

    return {
        "source": str(ALL_LAPTIMES_POSITIONS_CSV),
        "sourceType": "all_laptimes_positions_csv",
        "model": str(PREDICTION_MODEL_PATH),
        "lap": lap_number,
        "simulations": PREDICTION_SIMULATION_COUNT,
        "drivers": serialize_rank_probability(rank_probability),
    }


@app.post("/predictions/all-laptimes-positions-csv")
async def write_all_laptimes_positions_csv():
    positions_df = await asyncio.to_thread(load_all_laptimes_positions_csv)

    return {
        "csv": str(ALL_LAPTIMES_POSITIONS_CSV),
        "rows": len(positions_df),
        "columns": POSITIONS_CSV_COLUMNS,
    }


@app.get("/predictions/stream")
async def stream_predictions():
    async def generate():
        rank_probability = await asyncio.to_thread(fetch_rank_probability)

        for record in serialize_rank_probability(rank_probability):
            yield f"data: {json.dumps(record)}\n\n"
            await asyncio.sleep(0.15)

        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


def calculate_confidence(position, gap, probability):
    confidence = 50

    telemetry_quality = 75
    race_position_reliability = 60
    timing_gap_reliability = 60
    prediction_stability = 65

    if position is not None:
        confidence += 15
        race_position_reliability = 85

        if position <= 5:
            confidence += 10
            prediction_stability += 10
        elif position <= 10:
            confidence += 5

    if gap is not None:
        confidence += 15
        timing_gap_reliability = 85

        if gap <= 5:
            confidence += 5
            prediction_stability += 10
        elif gap > 15:
            confidence -= 10
            prediction_stability -= 10

    if probability >= 75 or probability <= 30:
        confidence += 5
        prediction_stability += 5

    confidence = round(max(40, min(95, confidence)), 1)

    return {
        "overall": confidence,
        "breakdown": {
            "Telemetry Quality": round(max(40, min(95, telemetry_quality)), 1),
            "Race Position Reliability": round(max(40, min(95, race_position_reliability)), 1),
            "Timing Gap Reliability": round(max(40, min(95, timing_gap_reliability)), 1),
            "Prediction Stability": round(max(40, min(95, prediction_stability)), 1),
        },
    }


def build_ai_betting_insight(driver: str, market: str, lap_number: int = 10):
    driver = driver.upper()

    try:
        position = race_position_for_driver_lap(driver, lap_number)
        gap = race_gap_for_driver_lap(driver, lap_number)
    except Exception:
        position = None
        gap = None

    base_probability = 50

    if position is not None:
        base_probability += max(0, 20 - position)

    if gap is not None:
        base_probability -= min(20, gap / 2)

    if "Top 3" in market:
        base_probability += 15
    elif "Top 5" in market:
        base_probability += 25
    elif "Race Winner" in market:
        base_probability += 5
    elif "Fastest Lap" in market:
        base_probability += 8
    elif "2nd Place" in market:
        base_probability += 6
    elif "3rd Place" in market:
        base_probability += 5

    probability = round(max(5, min(95, base_probability)), 1)

    confidence_data = calculate_confidence(position, gap, probability)
    confidence = confidence_data["overall"]

    if probability >= 75 and confidence >= 70:
        risk = "Low"
        recommendation = "Strong value opportunity"
    elif probability >= 55 and confidence >= 60:
        risk = "Medium"
        recommendation = "Watchlist opportunity"
    else:
        risk = "High"
        recommendation = "Low value"

    return {
        "driver": driver,
        "market": market,
        "lap": lap_number,
        "position": position,
        "gapSeconds": gap,
        "probability": probability,
        "confidence": confidence,
        "confidenceBreakdown": confidence_data["breakdown"],
        "risk": risk,
        "recommendation": recommendation,
        "momentumScore": round(probability - 50, 1),
        "reasons": [
            "Race position was used to estimate competitive advantage.",
            "Timing gap was used to estimate how difficult the bet is to achieve.",
            "Market type was adjusted based on expected finish probability.",
            "Confidence is based on telemetry quality, race position reliability, timing gap reliability, and prediction stability.",
        ],
    }


@app.get("/ai/betting-insight/{driver}/{market}")
async def fetch_ai_betting_insight(driver: str, market: str, lap: int = 10):
    return build_ai_betting_insight(driver, market, lap)

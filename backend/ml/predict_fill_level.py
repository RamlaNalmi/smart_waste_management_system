import json
import sys
import warnings
from pathlib import Path

import joblib
import pandas as pd


MODEL_PATH = Path(__file__).with_name("linear_regression_model.joblib")
FEATURE_COLUMNS_PATH = Path(__file__).with_name("feature_columns.joblib")
NUMERIC_FEATURES = [
    "fill_level",
    "hour",
    "day_of_week",
    "day_of_month",
    "month",
    "lag_1",
    "lag_2",
    "lag_3",
    "rolling_mean_3",
    "fill_diff"
]


def clamp_percentage(value):
    return max(0, min(100, value))


def get_features(payload):
    timestamp = pd.to_datetime(payload.get("timestamp")) if payload.get("timestamp") else None
    if timestamp is not None:
        payload = {
            **payload,
            "hour": payload.get("hour", timestamp.hour),
            "day_of_week": payload.get("day_of_week", timestamp.dayofweek),
            "day_of_month": payload.get("day_of_month", timestamp.day),
            "month": payload.get("month", timestamp.month)
        }

    missing = [name for name in NUMERIC_FEATURES if payload.get(name) is None]
    if missing:
        raise ValueError(f"Missing required feature(s): {', '.join(missing)}")

    features = {name: float(payload[name]) for name in NUMERIC_FEATURES}
    features["bin_id"] = payload.get("bin_id") or payload.get("device_id")
    return features


def format_result(raw_prediction, features):
    return {
        "prediction": round(clamp_percentage(raw_prediction), 2),
        "rawPrediction": round(raw_prediction, 4),
        "features": features,
        "model": "linear_regression_model.joblib"
    }


def main():
    payload = json.loads(sys.stdin.read() or "{}")
    point_payloads = payload.get("points")
    is_batch = isinstance(point_payloads, list)
    points = point_payloads if is_batch else [payload]
    feature_rows = [get_features(point) for point in points]

    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        model = joblib.load(MODEL_PATH)
        model_features = list(joblib.load(FEATURE_COLUMNS_PATH))
        x_input = pd.DataFrame(feature_rows)
        raw_predictions = model.predict(x_input[model_features])

    results = [
        format_result(float(raw_prediction), features)
        for raw_prediction, features in zip(raw_predictions, feature_rows)
    ]

    print(json.dumps(results if is_batch else results[0]))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(json.dumps({"error": str(error)}), file=sys.stderr)
        sys.exit(1)

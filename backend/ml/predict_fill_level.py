import json
import sys
import warnings
from pathlib import Path

import joblib


MODEL_PATH = Path(__file__).with_name("linear_regression_model.joblib")
FEATURES = ["fill_level", "hour"]


def clamp_percentage(value):
    return max(0, min(100, value))


def main():
    payload = json.loads(sys.stdin.read() or "{}")
    missing = [name for name in FEATURES if payload.get(name) is None]

    if missing:
        raise ValueError(f"Missing required feature(s): {', '.join(missing)}")

    fill_level = float(payload["fill_level"])
    hour = float(payload["hour"])

    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        model = joblib.load(MODEL_PATH)
        raw_prediction = float(model.predict([[fill_level, hour]])[0])

    result = {
        "prediction": round(clamp_percentage(raw_prediction), 2),
        "rawPrediction": round(raw_prediction, 4),
        "features": {
            "fill_level": fill_level,
            "hour": hour
        },
        "model": "linear_regression_model.joblib"
    }

    print(json.dumps(result))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(json.dumps({"error": str(error)}), file=sys.stderr)
        sys.exit(1)

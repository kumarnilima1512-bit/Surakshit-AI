from fastapi import FastAPI, HTTPException
import joblib
import json
import pandas as pd

app = FastAPI(title="Surakshit AI ML Service")


# -----------------------------
# Load trained model
# -----------------------------
try:
    model = joblib.load("surakshit_ai_stress_model.pkl")
except Exception as e:
    raise RuntimeError(f"Failed to load ML model: {e}")


# -----------------------------
# Load model configuration
# -----------------------------
try:
    with open("surakshit_ai_model_config.json", "r") as f:
        config = json.load(f)
except Exception as e:
    raise RuntimeError(f"Failed to load model config: {e}")


FEATURES = config["features"]


# -----------------------------
# Health check
# -----------------------------
@app.get("/")
def health_check():
    return {
        "success": True,
        "service": "Surakshit AI ML Service",
        "model_loaded": True,
        "features": len(FEATURES)
    }


# -----------------------------
# Prediction
# -----------------------------
@app.post("/predict")
def predict(data: dict):

    # Check missing features
    missing_features = [
        feature for feature in FEATURES
        if feature not in data
    ]

    if missing_features:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Missing required features",
                "missing_features": missing_features
            }
        )

    try:
        # Keep feature order exactly as training config
        input_data = pd.DataFrame(
            [[data[feature] for feature in FEATURES]],
            columns=FEATURES
        )

        # Prediction
        prediction = model.predict(input_data)[0]

        stress_score = float(prediction)

        # Clamp to trained target range
        stress_score = max(1.0, min(10.0, stress_score))

        # Risk level from saved configuration
        risk_level = "Unknown"

        for level, limits in config["risk_levels"].items():
            lower, upper = limits

            if lower <= stress_score < upper:
                risk_level = level
                break

        # Include 10 in High range
        if stress_score == 10.0:
            risk_level = "High"

        return {
            "success": True,
            "stress_score": round(stress_score, 2),
            "risk_level": risk_level
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )
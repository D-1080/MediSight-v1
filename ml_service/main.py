from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pickle
import pandas as pd
import numpy as np
import shap
import json
from typing import List, Dict, Optional
import os

app = FastAPI(
    title="MediSight ML Service",
    description="AI-powered disease prediction microservice with SHAP explainability",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models and scalers
MODELS_DIR = "../models"

print("🔄 Loading ML models...")

# ── Helper ────────────────────────────────────────────────────────────────────
def try_load(path: str):
    """Load a joblib file, return None if not found."""
    if os.path.exists(path):
        return joblib.load(path)
    print(f"⚠️  Not found (run train_models.py first): {path}")
    return None

def try_load_pickle(path: str):
    if os.path.exists(path):
        with open(path, 'rb') as f:
            return pickle.load(f)
    print(f"⚠️  Not found: {path}")
    return None

def try_load_json(path: str):
    if os.path.exists(path):
        with open(path, 'r') as f:
            return json.load(f)
    print(f"⚠️  Not found: {path}")
    return {}

# ── Diabetes ──────────────────────────────────────────────────────────────────
diabetes_model   = try_load(f"{MODELS_DIR}/diabetes_model.pkl")
diabetes_scaler  = try_load(f"{MODELS_DIR}/diabetes_scaler.pkl")
diabetes_metadata = try_load_json(f"{MODELS_DIR}/diabetes_metadata.json")

# ── Heart Disease ─────────────────────────────────────────────────────────────
heart_model    = try_load(f"{MODELS_DIR}/heart_disease_model.pkl")
heart_scaler   = try_load(f"{MODELS_DIR}/heart_disease_scaler.pkl")
heart_metadata = try_load_json(f"{MODELS_DIR}/heart_disease_metadata.json")

# ── Stroke ────────────────────────────────────────────────────────────────────
stroke_model    = try_load(f"{MODELS_DIR}/stroke_model.pkl")
stroke_scaler   = try_load(f"{MODELS_DIR}/stroke_scaler.pkl")
stroke_encoders = try_load_pickle(f"{MODELS_DIR}/stroke_encoders.pkl")
stroke_metadata = try_load_json(f"{MODELS_DIR}/stroke_metadata.json")

# ── CKD ───────────────────────────────────────────────────────────────────────
ckd_model    = try_load(f"{MODELS_DIR}/ckd_model.pkl")
ckd_scaler   = try_load(f"{MODELS_DIR}/ckd_scaler.pkl")
ckd_medians  = try_load_json(f"{MODELS_DIR}/ckd_medians.json")
ckd_metadata = try_load_json(f"{MODELS_DIR}/ckd_metadata.json")

# ── SHAP explainers (only for loaded models) ─────────────────────────────────
print("🔄 Initializing SHAP explainers...")
diabetes_explainer = shap.TreeExplainer(diabetes_model) if diabetes_model else None
heart_explainer    = shap.TreeExplainer(heart_model)    if heart_model    else None
stroke_explainer   = shap.TreeExplainer(stroke_model)   if stroke_model   else None
ckd_explainer      = shap.TreeExplainer(ckd_model)      if ckd_model      else None

loaded = [n for n, m in [("diabetes", diabetes_model), ("heart_disease", heart_model),
                          ("stroke", stroke_model), ("ckd", ckd_model)] if m is not None]
print(f"✅ Models loaded: {loaded}")

# ==========================================
# Pydantic Models
# ==========================================

class DiabetesInput(BaseModel):
    Pregnancies: float
    Glucose: float
    BloodPressure: float
    SkinThickness: float
    Insulin: float
    BMI: float
    DiabetesPedigreeFunction: float
    Age: float

class HeartDiseaseInput(BaseModel):
    age: float
    sex: float
    cp: float
    trestbps: float
    chol: float
    fbs: float
    restecg: float
    thalach: float
    exang: float
    oldpeak: float
    slope: float
    ca: float
    thal: float

class StrokeInput(BaseModel):
    gender: str           # "Male" | "Female"
    age: float
    hypertension: int     # 0 | 1
    heart_disease: int    # 0 | 1
    ever_married: str     # "Yes" | "No"
    work_type: str        # "Private" | "Self-employed" | "Govt_job" | "children" | "Never_worked"
    Residence_type: str   # "Urban" | "Rural"
    avg_glucose_level: float
    bmi: float
    smoking_status: str   # "formerly smoked" | "never smoked" | "smokes" | "Unknown"


class CKDInput(BaseModel):
    age:   Optional[float] = None
    bp:    Optional[float] = None   # blood pressure
    sg:    Optional[float] = None   # specific gravity
    al:    Optional[float] = None   # albumin
    su:    Optional[float] = None   # sugar
    rbc:   Optional[float] = None   # red blood cells (0=normal, 1=abnormal)
    pc:    Optional[float] = None   # pus cell (0=normal, 1=abnormal)
    pcc:   Optional[float] = None   # pus cell clumps (0=notpresent, 1=present)
    ba:    Optional[float] = None   # bacteria (0=notpresent, 1=present)
    bgr:   Optional[float] = None   # blood glucose random
    bu:    Optional[float] = None   # blood urea
    sc:    Optional[float] = None   # serum creatinine
    sod:   Optional[float] = None   # sodium
    pot:   Optional[float] = None   # potassium
    hemo:  Optional[float] = None   # haemoglobin
    pcv:   Optional[float] = None   # packed cell volume
    wc:    Optional[float] = None   # white blood cell count
    rc:    Optional[float] = None   # red blood cell count
    htn:   Optional[float] = None   # hypertension (0=no, 1=yes)
    dm:    Optional[float] = None   # diabetes mellitus (0=no, 1=yes)
    cad:   Optional[float] = None   # coronary artery disease (0=no, 1=yes)
    appet: Optional[float] = None   # appetite (0=good, 1=poor)
    pe:    Optional[float] = None   # pedal edema (0=no, 1=yes)
    ane:   Optional[float] = None   # anemia (0=no, 1=yes)


class ShapValue(BaseModel):
    feature: str
    value: float
    shap_value: float

class PredictionResponse(BaseModel):
    model_config = {'protected_namespaces': ()}
    
    probability: float
    risk_level: str
    confidence: float
    shap_values: List[ShapValue]
    model_version: str
    model_metrics: Dict[str, float]

# ==========================================
# Health Check
# ==========================================

@app.get("/")
def read_root():
    return {
        "service": "MediSight ML Service",
        "status": "online",
        "version": "1.0.0",
        "models": [n for n, m in [("diabetes", diabetes_model), ("heart_disease", heart_model),
                                   ("stroke", stroke_model), ("ckd", ckd_model)] if m is not None]
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "models_loaded": {
            "diabetes":      diabetes_model is not None,
            "heart_disease": heart_model is not None,
            "stroke":        stroke_model is not None,
            "ckd":           ckd_model is not None,
        },
        "shap_ready": True
    }

# ==========================================
# Diabetes Prediction
# ==========================================

@app.post("/predict/diabetes", response_model=PredictionResponse)
def predict_diabetes(data: DiabetesInput):
    """
    Predict diabetes risk using XGBoost model with SHAP explainability
    """
    try:
        # Convert to DataFrame with feature names (fix for sklearn warning)
        import pandas as pd
        
        feature_names = diabetes_metadata['features']
        features_dict = {
            'Pregnancies': data.Pregnancies,
            'Glucose': data.Glucose,
            'BloodPressure': data.BloodPressure,
            'SkinThickness': data.SkinThickness,
            'Insulin': data.Insulin,
            'BMI': data.BMI,
            'DiabetesPedigreeFunction': data.DiabetesPedigreeFunction,
            'Age': data.Age
        }
        
        # Create DataFrame with proper column names
        features_df = pd.DataFrame([features_dict], columns=feature_names)
        
        # Scale features
        features_scaled = diabetes_scaler.transform(features_df)
        
        # Predict
        prediction_proba = diabetes_model.predict_proba(features_scaled)[0]
        probability = float(prediction_proba[1] * 100)  # Probability of diabetes
        confidence = float(max(prediction_proba) * 100)
        
        # Determine risk level
        if probability >= 70:
            risk_level = "HIGH"
        elif probability >= 40:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        
        # Get SHAP values
        shap_values = diabetes_explainer.shap_values(features_scaled)
        
        # Format SHAP values
        shap_explanation = [
            {
                "feature": feature_names[i],
                "value": float(list(features_dict.values())[i]),
                "shap_value": float(shap_values[0][i])
            }
            for i in range(len(feature_names))
        ]
        
        # Sort by absolute SHAP value (most important first)
        shap_explanation.sort(key=lambda x: abs(x['shap_value']), reverse=True)
        
        return PredictionResponse(
            probability=round(probability, 2),
            risk_level=risk_level,
            confidence=round(confidence, 2),
            shap_values=shap_explanation,
            model_version=diabetes_metadata['model_version'],
            model_metrics=diabetes_metadata['metrics']
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# ==========================================
# Heart Disease Prediction
# ==========================================

@app.post("/predict/heart_disease", response_model=PredictionResponse)
def predict_heart_disease(data: HeartDiseaseInput):
    """
    Predict heart disease risk using XGBoost model with SHAP explainability
    """
    try:
        # Convert to DataFrame with feature names
        import pandas as pd
        
        feature_names = heart_metadata['features']
        features_dict = {
            'age': data.age,
            'sex': data.sex,
            'cp': data.cp,
            'trestbps': data.trestbps,
            'chol': data.chol,
            'fbs': data.fbs,
            'restecg': data.restecg,
            'thalach': data.thalach,
            'exang': data.exang,
            'oldpeak': data.oldpeak,
            'slope': data.slope,
            'ca': data.ca,
            'thal': data.thal
        }
        
        # Create DataFrame with proper column names
        features_df = pd.DataFrame([features_dict], columns=feature_names)
        
        # Scale features
        features_scaled = heart_scaler.transform(features_df)
        
        # Predict
        prediction_proba = heart_model.predict_proba(features_scaled)[0]
        probability = float(prediction_proba[1] * 100)
        confidence = float(max(prediction_proba) * 100)
        
        # Determine risk level
        if probability >= 70:
            risk_level = "HIGH"
        elif probability >= 40:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        
        # Get SHAP values
        shap_values = heart_explainer.shap_values(features_scaled)
        
        # Format SHAP values
        shap_explanation = [
            {
                "feature": feature_names[i],
                "value": float(list(features_dict.values())[i]),
                "shap_value": float(shap_values[0][i])
            }
            for i in range(len(feature_names))
        ]
        
        # Sort by absolute SHAP value
        shap_explanation.sort(key=lambda x: abs(x['shap_value']), reverse=True)
        
        return PredictionResponse(
            probability=round(probability, 2),
            risk_level=risk_level,
            confidence=round(confidence, 2),
            shap_values=shap_explanation,
            model_version=heart_metadata['model_version'],
            model_metrics=heart_metadata['metrics']
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
    
# ==========================================
# Stroke Prediction
# ==========================================

@app.post("/predict/stroke", response_model=PredictionResponse)
def predict_stroke(data: StrokeInput):
    """
    Predict stroke risk using XGBoost model with SHAP explainability.
    Categorical fields are label-encoded using the trained encoders.
    """
    if stroke_model is None or stroke_scaler is None or stroke_encoders is None:
        raise HTTPException(
            status_code=503,
            detail="Stroke model not loaded. Run train_models.py first to generate stroke_model.pkl."
        )
    try:
        feature_names = stroke_metadata['features']

        # Encode categoricals using saved LabelEncoders
        def safe_encode(encoder, value: str) -> int:
            classes = list(encoder.classes_)
            if value in classes:
                return int(encoder.transform([value])[0])
            # Unknown value → use most frequent class (index 0)
            return 0

        features_dict = {
            'gender':            safe_encode(stroke_encoders['gender'],         data.gender),
            'age':               data.age,
            'hypertension':      data.hypertension,
            'heart_disease':     data.heart_disease,
            'ever_married':      safe_encode(stroke_encoders['ever_married'],    data.ever_married),
            'work_type':         safe_encode(stroke_encoders['work_type'],       data.work_type),
            'Residence_type':    safe_encode(stroke_encoders['Residence_type'],  data.Residence_type),
            'avg_glucose_level': data.avg_glucose_level,
            'bmi':               data.bmi,
            'smoking_status':    safe_encode(stroke_encoders['smoking_status'],  data.smoking_status),
        }

        features_df = pd.DataFrame([features_dict], columns=feature_names)
        features_scaled = stroke_scaler.transform(features_df)

        prediction_proba = stroke_model.predict_proba(features_scaled)[0]
        probability  = float(prediction_proba[1] * 100)
        confidence   = float(max(prediction_proba) * 100)
        threshold    = stroke_metadata.get('threshold', 0.3) * 100  # stored as 0-1, compare to %

        if probability >= 60:
            risk_level = "HIGH"
        elif probability >= threshold:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # SHAP values
        shap_values = stroke_explainer.shap_values(features_scaled)
        raw_values  = list(features_dict.values())

        shap_explanation = [
            {
                "feature":    feature_names[i],
                "value":      float(raw_values[i]),
                "shap_value": float(shap_values[0][i]),
            }
            for i in range(len(feature_names))
        ]
        shap_explanation.sort(key=lambda x: abs(x['shap_value']), reverse=True)

        return PredictionResponse(
            probability=round(probability, 2),
            risk_level=risk_level,
            confidence=round(confidence, 2),
            shap_values=shap_explanation,
            model_version=stroke_metadata['model_version'],
            model_metrics=stroke_metadata['metrics'],
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Stroke prediction failed: {str(e)}")


# ==========================================
# CKD Prediction
# ==========================================

@app.post("/predict/ckd", response_model=PredictionResponse)
def predict_ckd(data: CKDInput):
    """
    Predict Chronic Kidney Disease risk.
    All features are optional — missing values are imputed with training medians.
    """
    if ckd_model is None or ckd_scaler is None:
        raise HTTPException(
            status_code=503,
            detail="CKD model not loaded. Run train_models.py first to generate ckd_model.pkl."
        )
    try:
        feature_names = ckd_metadata['features']

        # Build dict, filling missing with training median
        raw = data.model_dump()
        features_dict = {
            col: (raw[col] if raw.get(col) is not None else ckd_medians.get(col, 0.0))
            for col in feature_names
        }

        features_df = pd.DataFrame([features_dict], columns=feature_names)
        features_scaled = ckd_scaler.transform(features_df)

        prediction_proba = ckd_model.predict_proba(features_scaled)[0]
        probability = float(prediction_proba[1] * 100)
        confidence  = float(max(prediction_proba) * 100)

        if probability >= 70:
            risk_level = "HIGH"
        elif probability >= 40:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # SHAP values
        shap_values = ckd_explainer.shap_values(features_scaled)
        raw_values  = list(features_dict.values())

        shap_explanation = [
            {
                "feature":    feature_names[i],
                "value":      float(raw_values[i]),
                "shap_value": float(shap_values[0][i]),
            }
            for i in range(len(feature_names))
        ]
        shap_explanation.sort(key=lambda x: abs(x['shap_value']), reverse=True)

        return PredictionResponse(
            probability=round(probability, 2),
            risk_level=risk_level,
            confidence=round(confidence, 2),
            shap_values=shap_explanation,
            model_version=ckd_metadata['model_version'],
            model_metrics=ckd_metadata['metrics'],
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"CKD prediction failed: {str(e)}")


# ==========================================
# Model Info
# ==========================================

@app.get("/models/diabetes/info")
def get_diabetes_model_info():
    return diabetes_metadata

@app.get("/models/heart_disease/info")
def get_heart_disease_model_info():
    return heart_metadata

@app.get("/models/stroke/info")
def get_stroke_model_info():
    return stroke_metadata

@app.get("/models/ckd/info")
def get_ckd_model_info():
    return ckd_metadata

@app.get("/models/info")
def get_all_models_info():
    return {
        "diabetes":     diabetes_metadata,
        "heart_disease": heart_metadata,
        "stroke":        stroke_metadata,
        "ckd":           ckd_metadata,
    }


# ==========================================
# Batch Prediction
# ==========================================

@app.post("/predict/diabetes/batch")
def predict_diabetes_batch(data: List[DiabetesInput]):
    results = []
    for patient_data in data:
        try:
            results.append(predict_diabetes(patient_data).model_dump())
        except Exception as e:
            results.append({"error": str(e)})
    return results

@app.post("/predict/heart_disease/batch")
def predict_heart_disease_batch(data: List[HeartDiseaseInput]):
    results = []
    for patient_data in data:
        try:
            results.append(predict_heart_disease(patient_data).model_dump())
        except Exception as e:
            results.append({"error": str(e)})
    return results


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
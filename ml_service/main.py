from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import shap
import json
from typing import List, Dict
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

# Diabetes model
diabetes_model = joblib.load(f"{MODELS_DIR}/diabetes_model.pkl")
diabetes_scaler = joblib.load(f"{MODELS_DIR}/diabetes_scaler.pkl")
with open(f"{MODELS_DIR}/diabetes_metadata.json", 'r') as f:
    diabetes_metadata = json.load(f)

# Heart disease model
heart_model = joblib.load(f"{MODELS_DIR}/heart_disease_model.pkl")
heart_scaler = joblib.load(f"{MODELS_DIR}/heart_disease_scaler.pkl")
with open(f"{MODELS_DIR}/heart_disease_metadata.json", 'r') as f:
    heart_metadata = json.load(f)

# Initialize SHAP explainers
print("🔄 Initializing SHAP explainers...")
diabetes_explainer = shap.TreeExplainer(diabetes_model)
heart_explainer = shap.TreeExplainer(heart_model)

print("✅ Models loaded successfully!")

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

class ShapValue(BaseModel):
    feature: str
    value: float
    shap_value: float

class PredictionResponse(BaseModel):
    model_config = {'protected_namespaces': ()}
    
    probability: float
    risk_level: str
    confidence: float
    shap_values: List[ShapValue]  # ✅ Correct - list of ShapValue objects
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
        "models": ["diabetes", "heart_disease"]
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "models_loaded": {
            "diabetes": True,
            "heart_disease": True
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
# Model Info
# ==========================================

@app.get("/models/diabetes/info")
def get_diabetes_model_info():
    """Get diabetes model information and performance metrics"""
    return diabetes_metadata

@app.get("/models/heart_disease/info")
def get_heart_disease_model_info():
    """Get heart disease model information and performance metrics"""
    return heart_metadata

@app.get("/models/info")
def get_all_models_info():
    """Get all models information"""
    return {
        "diabetes": diabetes_metadata,
        "heart_disease": heart_metadata
    }

# ==========================================
# Batch Prediction (Optional)
# ==========================================

@app.post("/predict/diabetes/batch")
def predict_diabetes_batch(data: List[DiabetesInput]):
    """Batch prediction for multiple patients"""
    results = []
    for patient_data in data:
        try:
            result = predict_diabetes(patient_data)
            results.append(result.dict())
        except Exception as e:
            results.append({"error": str(e)})
    return results

@app.post("/predict/heart_disease/batch")
def predict_heart_disease_batch(data: List[HeartDiseaseInput]):
    """Batch prediction for multiple patients"""
    results = []
    for patient_data in data:
        try:
            result = predict_heart_disease(patient_data)
            results.append(result.dict())
        except Exception as e:
            results.append({"error": str(e)})
    return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
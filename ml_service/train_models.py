import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (accuracy_score, precision_score, recall_score, 
                            f1_score, roc_auc_score, confusion_matrix, 
                            classification_report)
from xgboost import XGBClassifier
import joblib
import json
import os
from pathlib import Path

# Create directories
os.makedirs('../models', exist_ok=True)
os.makedirs('logs', exist_ok=True)

print("=" * 70)
print("🏥 MEDISIGHT - ML MODEL TRAINING")
print("=" * 70)

# ==========================================
# 1. DIABETES MODEL TRAINING
# ==========================================
print("\n📊 TRAINING DIABETES PREDICTION MODEL")
print("-" * 70)

# Load diabetes dataset
diabetes_df = pd.read_csv('../Dataset/Pima_Indians_Diabetes_Dataset/diabetes.csv')

print(f"✓ Dataset loaded: {diabetes_df.shape[0]} samples, {diabetes_df.shape[1]} features")

# Handle zero values (missing data)
zero_columns = ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI']
for col in zero_columns:
    diabetes_df[col] = diabetes_df[col].replace(0, diabetes_df[col].median())

# Prepare features and target
X_diabetes = diabetes_df.drop('Outcome', axis=1)
y_diabetes = diabetes_df['Outcome']

# Split data
X_train_d, X_test_d, y_train_d, y_test_d = train_test_split(
    X_diabetes, y_diabetes, test_size=0.2, random_state=42, stratify=y_diabetes
)

print(f"✓ Train set: {len(X_train_d)} samples")
print(f"✓ Test set: {len(X_test_d)} samples")

# Scale features
scaler_diabetes = StandardScaler()
X_train_d_scaled = scaler_diabetes.fit_transform(X_train_d)
X_test_d_scaled = scaler_diabetes.transform(X_test_d)

# Train XGBoost model
model_diabetes = XGBClassifier(
    n_estimators=100,
    max_depth=5,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    eval_metric='logloss'
)

print("\n🔄 Training model...")
model_diabetes.fit(X_train_d_scaled, y_train_d)

# Predictions
y_pred_d = model_diabetes.predict(X_test_d_scaled)
y_pred_proba_d = model_diabetes.predict_proba(X_test_d_scaled)[:, 1]

# Evaluation
print("\n" + "=" * 70)
print("📈 DIABETES MODEL PERFORMANCE")
print("=" * 70)

accuracy_d = accuracy_score(y_test_d, y_pred_d)
precision_d = precision_score(y_test_d, y_pred_d)
recall_d = recall_score(y_test_d, y_pred_d)
f1_d = f1_score(y_test_d, y_pred_d)
auc_d = roc_auc_score(y_test_d, y_pred_proba_d)

print(f"\n✓ Accuracy:  {accuracy_d:.4f} ({accuracy_d*100:.2f}%)")
print(f"✓ Precision: {precision_d:.4f}")
print(f"✓ Recall:    {recall_d:.4f}")
print(f"✓ F1 Score:  {f1_d:.4f}")
print(f"✓ AUC Score: {auc_d:.4f}")

cm_d = confusion_matrix(y_test_d, y_pred_d)
print("\n📊 Confusion Matrix:")
print(f"  True Negatives:  {cm_d[0][0]}")
print(f"  False Positives: {cm_d[0][1]}")
print(f"  False Negatives: {cm_d[1][0]}")
print(f"  True Positives:  {cm_d[1][1]}")

# Cross-validation
cv_scores_d = cross_val_score(model_diabetes, X_train_d_scaled, y_train_d, cv=5, scoring='roc_auc')
print(f"\n✓ Cross-Validation AUC: {cv_scores_d.mean():.4f} (+/- {cv_scores_d.std() * 2:.4f})")

# Feature importance
feature_importance_d = pd.DataFrame({
    'feature': X_diabetes.columns,
    'importance': model_diabetes.feature_importances_
}).sort_values('importance', ascending=False)

print("\n🔍 Top 5 Important Features:")
for idx, row in feature_importance_d.head().iterrows():
    print(f"  {row['feature']:30s} {row['importance']:.4f}")

# Save model
print("\n💾 Saving diabetes model...")
joblib.dump(model_diabetes, '../models/diabetes_model.pkl')
joblib.dump(scaler_diabetes, '../models/diabetes_scaler.pkl')

# Save metadata
metadata_diabetes = {
    'model_name': 'Diabetes Type 2 Prediction Model',
    'model_version': 'v1.0.0',
    'features': X_diabetes.columns.tolist(),
    'target': 'Outcome',
    'metrics': {
        'accuracy': float(accuracy_d),
        'precision': float(precision_d),
        'recall': float(recall_d),
        'f1_score': float(f1_d),
        'auc_score': float(auc_d)
    },
    'confusion_matrix': {
        'true_positives': int(cm_d[1][1]),
        'false_positives': int(cm_d[0][1]),
        'false_negatives': int(cm_d[1][0]),
        'true_negatives': int(cm_d[0][0])
    },
    'feature_importance': feature_importance_d.to_dict('records'),
    'training_samples': len(X_train_d),
    'test_samples': len(X_test_d),
    'training_date': pd.Timestamp.now().isoformat()
}

with open('../models/diabetes_metadata.json', 'w') as f:
    json.dump(metadata_diabetes, f, indent=4)

print("✅ Diabetes model saved successfully!")

# ==========================================
# 2. HEART DISEASE MODEL TRAINING
# ==========================================
print("\n" + "=" * 70)
print("📊 TRAINING HEART DISEASE PREDICTION MODEL")
print("-" * 70)

# Load heart disease dataset
heart_df = pd.read_csv('../Dataset/Cleveland_Heart_Disease/heart.csv')

print(f"✓ Dataset loaded: {heart_df.shape[0]} samples, {heart_df.shape[1]} features")

# Prepare features and target
X_heart = heart_df.drop('target', axis=1)
y_heart = heart_df['target']

# Split data
X_train_h, X_test_h, y_train_h, y_test_h = train_test_split(
    X_heart, y_heart, test_size=0.2, random_state=42, stratify=y_heart
)

print(f"✓ Train set: {len(X_train_h)} samples")
print(f"✓ Test set: {len(X_test_h)} samples")

# Scale features
scaler_heart = StandardScaler()
X_train_h_scaled = scaler_heart.fit_transform(X_train_h)
X_test_h_scaled = scaler_heart.transform(X_test_h)

# Train XGBoost model
model_heart = XGBClassifier(
    n_estimators=100,
    max_depth=4,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    eval_metric='logloss'
)

print("\n🔄 Training model...")
model_heart.fit(X_train_h_scaled, y_train_h)

# Predictions
y_pred_h = model_heart.predict(X_test_h_scaled)
y_pred_proba_h = model_heart.predict_proba(X_test_h_scaled)[:, 1]

# Evaluation
print("\n" + "=" * 70)
print("📈 HEART DISEASE MODEL PERFORMANCE")
print("=" * 70)

accuracy_h = accuracy_score(y_test_h, y_pred_h)
precision_h = precision_score(y_test_h, y_pred_h)
recall_h = recall_score(y_test_h, y_pred_h)
f1_h = f1_score(y_test_h, y_pred_h)
auc_h = roc_auc_score(y_test_h, y_pred_proba_h)

print(f"\n✓ Accuracy:  {accuracy_h:.4f} ({accuracy_h*100:.2f}%)")
print(f"✓ Precision: {precision_h:.4f}")
print(f"✓ Recall:    {recall_h:.4f}")
print(f"✓ F1 Score:  {f1_h:.4f}")
print(f"✓ AUC Score: {auc_h:.4f}")

cm_h = confusion_matrix(y_test_h, y_pred_h)
print("\n📊 Confusion Matrix:")
print(f"  True Negatives:  {cm_h[0][0]}")
print(f"  False Positives: {cm_h[0][1]}")
print(f"  False Negatives: {cm_h[1][0]}")
print(f"  True Positives:  {cm_h[1][1]}")

# Cross-validation
cv_scores_h = cross_val_score(model_heart, X_train_h_scaled, y_train_h, cv=5, scoring='roc_auc')
print(f"\n✓ Cross-Validation AUC: {cv_scores_h.mean():.4f} (+/- {cv_scores_h.std() * 2:.4f})")

# Feature importance
feature_importance_h = pd.DataFrame({
    'feature': X_heart.columns,
    'importance': model_heart.feature_importances_
}).sort_values('importance', ascending=False)

print("\n🔍 Top 5 Important Features:")
for idx, row in feature_importance_h.head().iterrows():
    print(f"  {row['feature']:30s} {row['importance']:.4f}")

# Save model
print("\n💾 Saving heart disease model...")
joblib.dump(model_heart, '../models/heart_disease_model.pkl')
joblib.dump(scaler_heart, '../models/heart_disease_scaler.pkl')

# Save metadata
metadata_heart = {
    'model_name': 'Heart Disease Prediction Model',
    'model_version': 'v1.0.0',
    'features': X_heart.columns.tolist(),
    'target': 'target',
    'metrics': {
        'accuracy': float(accuracy_h),
        'precision': float(precision_h),
        'recall': float(recall_h),
        'f1_score': float(f1_h),
        'auc_score': float(auc_h)
    },
    'confusion_matrix': {
        'true_positives': int(cm_h[1][1]),
        'false_positives': int(cm_h[0][1]),
        'false_negatives': int(cm_h[1][0]),
        'true_negatives': int(cm_h[0][0])
    },
    'feature_importance': feature_importance_h.to_dict('records'),
    'training_samples': len(X_train_h),
    'test_samples': len(X_test_h),
    'training_date': pd.Timestamp.now().isoformat()
}

with open('../models/heart_disease_metadata.json', 'w') as f:
    json.dump(metadata_heart, f, indent=4)

print("✅ Heart disease model saved successfully!")

# ==========================================
# SUMMARY
# ==========================================
print("\n" + "=" * 70)
print("🎉 MODEL TRAINING COMPLETE!")
print("=" * 70)
print("\n📁 Saved Models:")
print("  ├── diabetes_model.pkl")
print("  ├── diabetes_scaler.pkl")
print("  ├── diabetes_metadata.json")
print("  ├── heart_disease_model.pkl")
print("  ├── heart_disease_scaler.pkl")
print("  └── heart_disease_metadata.json")

print("\n📊 Model Performance Summary:")
print(f"  Diabetes Model:      AUC = {auc_d:.4f}, Accuracy = {accuracy_d*100:.2f}%")
print(f"  Heart Disease Model: AUC = {auc_h:.4f}, Accuracy = {accuracy_h*100:.2f}%")

print("\n✅ Models are ready for deployment!")
print("=" * 70)

# ==========================================
# 3. STROKE MODEL TRAINING
# ==========================================
print("\n" + "=" * 70)
print("📊 TRAINING STROKE PREDICTION MODEL")
print("-" * 70)
 
# Load stroke dataset
# Dataset: https://www.kaggle.com/datasets/fedesoriano/stroke-prediction-dataset
stroke_df = pd.read_csv('../Dataset/Stroke_Prediction_Dataset/healthcare-dataset-stroke-data.csv')
 
print(f"✓ Dataset loaded: {stroke_df.shape[0]} samples, {stroke_df.shape[1]} features")
 
# Drop ID column
stroke_df.drop(columns=['id'], inplace=True, errors='ignore')
 
# Drop rare 'Other' gender rows
stroke_df = stroke_df[stroke_df['gender'] != 'Other']
 
# Encode categorical features
from sklearn.preprocessing import LabelEncoder
 
le_gender = LabelEncoder()
le_married = LabelEncoder()
le_work = LabelEncoder()
le_residence = LabelEncoder()
le_smoking = LabelEncoder()
 
stroke_df['gender']          = le_gender.fit_transform(stroke_df['gender'])
stroke_df['ever_married']    = le_married.fit_transform(stroke_df['ever_married'])
stroke_df['work_type']       = le_work.fit_transform(stroke_df['work_type'])
stroke_df['Residence_type']  = le_residence.fit_transform(stroke_df['Residence_type'])
stroke_df['smoking_status']  = le_smoking.fit_transform(stroke_df['smoking_status'].astype(str))
 
# BMI: fill missing with median
stroke_df['bmi'] = pd.to_numeric(stroke_df['bmi'], errors='coerce')
stroke_df['bmi'].fillna(stroke_df['bmi'].median(), inplace=True)
 
# Prepare features and target
STROKE_FEATURES = [
    'gender', 'age', 'hypertension', 'heart_disease', 'ever_married',
    'work_type', 'Residence_type', 'avg_glucose_level', 'bmi', 'smoking_status'
]
X_stroke = stroke_df[STROKE_FEATURES]
y_stroke = stroke_df['stroke']
 
print(f"✓ Class distribution: {y_stroke.value_counts().to_dict()}")
 
# Split
X_train_s, X_test_s, y_train_s, y_test_s = train_test_split(
    X_stroke, y_stroke, test_size=0.2, random_state=42, stratify=y_stroke
)
 
# Handle class imbalance with scale_pos_weight
neg_count = (y_train_s == 0).sum()
pos_count = (y_train_s == 1).sum()
scale_pos_weight = neg_count / pos_count
 
# Scale features
scaler_stroke = StandardScaler()
X_train_s_scaled = scaler_stroke.fit_transform(X_train_s)
X_test_s_scaled  = scaler_stroke.transform(X_test_s)
 
# Train XGBoost model
model_stroke = XGBClassifier(
    n_estimators=200,
    max_depth=4,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=scale_pos_weight,
    random_state=42,
    eval_metric='logloss'
)
 
print("\n🔄 Training model...")
model_stroke.fit(X_train_s_scaled, y_train_s)
 
# Predictions (use lower threshold due to class imbalance)
y_pred_proba_s = model_stroke.predict_proba(X_test_s_scaled)[:, 1]
threshold_s = 0.3
y_pred_s = (y_pred_proba_s >= threshold_s).astype(int)
 
# Evaluation
print("\n" + "=" * 70)
print("📈 STROKE MODEL PERFORMANCE")
print("=" * 70)
 
accuracy_s = accuracy_score(y_test_s, y_pred_s)
precision_s = precision_score(y_test_s, y_pred_s, zero_division=0)
recall_s    = recall_score(y_test_s, y_pred_s, zero_division=0)
f1_s        = f1_score(y_test_s, y_pred_s, zero_division=0)
auc_s       = roc_auc_score(y_test_s, y_pred_proba_s)
 
print(f"\n✓ Accuracy:  {accuracy_s:.4f} ({accuracy_s*100:.2f}%)")
print(f"✓ Precision: {precision_s:.4f}")
print(f"✓ Recall:    {recall_s:.4f}")
print(f"✓ F1 Score:  {f1_s:.4f}")
print(f"✓ AUC Score: {auc_s:.4f}")
print(f"✓ Threshold: {threshold_s} (adjusted for class imbalance)")
 
cm_s = confusion_matrix(y_test_s, y_pred_s)
print("\n📊 Confusion Matrix:")
print(f"  True Negatives:  {cm_s[0][0]}")
print(f"  False Positives: {cm_s[0][1]}")
print(f"  False Negatives: {cm_s[1][0]}")
print(f"  True Positives:  {cm_s[1][1]}")
 
# Feature importance
feature_importance_s = pd.DataFrame({
    'feature': STROKE_FEATURES,
    'importance': model_stroke.feature_importances_
}).sort_values('importance', ascending=False)
 
print("\n🔍 Top 5 Important Features:")
for _, row in feature_importance_s.head().iterrows():
    print(f"  {row['feature']:30s} {row['importance']:.4f}")
 
# Save
print("\n💾 Saving stroke model...")
joblib.dump(model_stroke, '../models/stroke_model.pkl')
joblib.dump(scaler_stroke, '../models/stroke_scaler.pkl')
 
# Save label encoders for inference
import pickle
encoders_stroke = {
    'gender': le_gender,
    'ever_married': le_married,
    'work_type': le_work,
    'Residence_type': le_residence,
    'smoking_status': le_smoking,
}
with open('../models/stroke_encoders.pkl', 'wb') as f:
    pickle.dump(encoders_stroke, f)
 
metadata_stroke = {
    'model_name':  'Stroke Risk Prediction Model',
    'model_version': 'v1.0.0',
    'features': STROKE_FEATURES,
    'target': 'stroke',
    'threshold': threshold_s,
    'categorical_features': ['gender', 'ever_married', 'work_type', 'Residence_type', 'smoking_status'],
    'categorical_values': {
        'gender':         list(le_gender.classes_),
        'ever_married':   list(le_married.classes_),
        'work_type':      list(le_work.classes_),
        'Residence_type': list(le_residence.classes_),
        'smoking_status': list(le_smoking.classes_),
    },
    'metrics': {
        'accuracy':  float(accuracy_s),
        'precision': float(precision_s),
        'recall':    float(recall_s),
        'f1_score':  float(f1_s),
        'auc_score': float(auc_s),
    },
    'confusion_matrix': {
        'true_positives':  int(cm_s[1][1]),
        'false_positives': int(cm_s[0][1]),
        'false_negatives': int(cm_s[1][0]),
        'true_negatives':  int(cm_s[0][0]),
    },
    'feature_importance': feature_importance_s.to_dict('records'),
    'training_samples': len(X_train_s),
    'test_samples':     len(X_test_s),
    'training_date':    pd.Timestamp.now().isoformat(),
}
 
with open('../models/stroke_metadata.json', 'w') as f:
    json.dump(metadata_stroke, f, indent=4)
 
print("✅ Stroke model saved successfully!")
 
 
# ==========================================
# 4. CHRONIC KIDNEY DISEASE (CKD) MODEL
# ==========================================
print("\n" + "=" * 70)
print("📊 TRAINING CHRONIC KIDNEY DISEASE (CKD) PREDICTION MODEL")
print("-" * 70)
 
# Dataset: UCI Chronic Kidney Disease
# https://archive.ics.uci.edu/dataset/336/chronic+kidney+disease
ckd_df = pd.read_csv('../Dataset/CKD_Dataset/kidney_disease.csv')
 
print(f"✓ Dataset loaded: {ckd_df.shape[0]} samples, {ckd_df.shape[1]} features")
 
# Standardise column names
ckd_df.columns = [c.strip() for c in ckd_df.columns]
ckd_df.drop(columns=['id'], inplace=True, errors='ignore')
 
# Clean string whitespace and tabs
for col in ckd_df.select_dtypes(include='object').columns:
    ckd_df[col] = ckd_df[col].astype(str).str.strip().str.replace(r'\t', '', regex=True)
 
# Encode target
ckd_df['classification'] = ckd_df['classification'].map(
    {'ckd': 1, 'notckd': 0}
)
ckd_df.dropna(subset=['classification'], inplace=True)
 
# Encode binary categorical columns
binary_map = {
    'rbc':   {'normal': 0, 'abnormal': 1},
    'pc':    {'normal': 0, 'abnormal': 1},
    'pcc':   {'notpresent': 0, 'present': 1},
    'ba':    {'notpresent': 0, 'present': 1},
    'htn':   {'no': 0, 'yes': 1},
    'dm':    {'no': 0, 'yes': 1},
    'cad':   {'no': 0, 'yes': 1},
    'appet': {'good': 0, 'poor': 1},
    'pe':    {'no': 0, 'yes': 1},
    'ane':   {'no': 0, 'yes': 1},
}
for col, mapping in binary_map.items():
    if col in ckd_df.columns:
        ckd_df[col] = ckd_df[col].map(mapping)
 
# Convert all remaining columns to numeric
CKD_FEATURES = [
    'age', 'bp', 'sg', 'al', 'su', 'rbc', 'pc', 'pcc', 'ba',
    'bgr', 'bu', 'sc', 'sod', 'pot', 'hemo', 'pcv', 'wc', 'rc',
    'htn', 'dm', 'cad', 'appet', 'pe', 'ane'
]
for col in CKD_FEATURES:
    if col in ckd_df.columns:
        ckd_df[col] = pd.to_numeric(ckd_df[col], errors='coerce')
 
X_ckd = ckd_df[CKD_FEATURES].copy()
y_ckd = ckd_df['classification'].astype(int)
 
print(f"✓ Class distribution: {y_ckd.value_counts().to_dict()}")
 
# Split
X_train_c, X_test_c, y_train_c, y_test_c = train_test_split(
    X_ckd, y_ckd, test_size=0.2, random_state=42, stratify=y_ckd
)
 
# Scale (imputation happens inside XGBoost natively for NaN)
scaler_ckd = StandardScaler()
 
# Fill NaN with median before scaling
X_train_c_filled = X_train_c.fillna(X_train_c.median())
X_test_c_filled  = X_test_c.fillna(X_train_c.median())
 
X_train_c_scaled = scaler_ckd.fit_transform(X_train_c_filled)
X_test_c_scaled  = scaler_ckd.transform(X_test_c_filled)
 
# Train XGBoost model
model_ckd = XGBClassifier(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    eval_metric='logloss'
)
 
print("\n🔄 Training model...")
model_ckd.fit(X_train_c_scaled, y_train_c)
 
y_pred_c      = model_ckd.predict(X_test_c_scaled)
y_pred_proba_c = model_ckd.predict_proba(X_test_c_scaled)[:, 1]
 
# Evaluation
print("\n" + "=" * 70)
print("📈 CKD MODEL PERFORMANCE")
print("=" * 70)
 
accuracy_c  = accuracy_score(y_test_c, y_pred_c)
precision_c = precision_score(y_test_c, y_pred_c, zero_division=0)
recall_c    = recall_score(y_test_c, y_pred_c, zero_division=0)
f1_c        = f1_score(y_test_c, y_pred_c, zero_division=0)
auc_c       = roc_auc_score(y_test_c, y_pred_proba_c)
 
print(f"\n✓ Accuracy:  {accuracy_c:.4f} ({accuracy_c*100:.2f}%)")
print(f"✓ Precision: {precision_c:.4f}")
print(f"✓ Recall:    {recall_c:.4f}")
print(f"✓ F1 Score:  {f1_c:.4f}")
print(f"✓ AUC Score: {auc_c:.4f}")
 
cm_c = confusion_matrix(y_test_c, y_pred_c)
print("\n📊 Confusion Matrix:")
print(f"  True Negatives:  {cm_c[0][0]}")
print(f"  False Positives: {cm_c[0][1]}")
print(f"  False Negatives: {cm_c[1][0]}")
print(f"  True Positives:  {cm_c[1][1]}")
 
# Feature importance
feature_importance_c = pd.DataFrame({
    'feature': CKD_FEATURES,
    'importance': model_ckd.feature_importances_
}).sort_values('importance', ascending=False)
 
print("\n🔍 Top 5 Important Features:")
for _, row in feature_importance_c.head().iterrows():
    print(f"  {row['feature']:30s} {row['importance']:.4f}")
 
# Save
print("\n💾 Saving CKD model...")
joblib.dump(model_ckd,   '../models/ckd_model.pkl')
joblib.dump(scaler_ckd,  '../models/ckd_scaler.pkl')
 
# Save training medians for inference-time imputation
ckd_medians = X_train_c.median().to_dict()
with open('../models/ckd_medians.json', 'w') as f:
    json.dump({k: float(v) if pd.notna(v) else 0.0 for k, v in ckd_medians.items()}, f, indent=4)
 
metadata_ckd = {
    'model_name':    'Chronic Kidney Disease Prediction Model',
    'model_version': 'v1.0.0',
    'features':      CKD_FEATURES,
    'target':        'classification',
    'threshold':     0.5,
    'metrics': {
        'accuracy':  float(accuracy_c),
        'precision': float(precision_c),
        'recall':    float(recall_c),
        'f1_score':  float(f1_c),
        'auc_score': float(auc_c),
    },
    'confusion_matrix': {
        'true_positives':  int(cm_c[1][1]),
        'false_positives': int(cm_c[0][1]),
        'false_negatives': int(cm_c[1][0]),
        'true_negatives':  int(cm_c[0][0]),
    },
    'feature_importance': feature_importance_c.to_dict('records'),
    'training_samples': len(X_train_c),
    'test_samples':     len(X_test_c),
    'training_date':    pd.Timestamp.now().isoformat(),
}
 
with open('../models/ckd_metadata.json', 'w') as f:
    json.dump(metadata_ckd, f, indent=4)
 
print("✅ CKD model saved successfully!")
 
 
# ==========================================
# UPDATED SUMMARY
# ==========================================
print("\n" + "=" * 70)
print("🎉 ALL MODEL TRAINING COMPLETE!")
print("=" * 70)
print("\n📁 Saved Models:")
print("  ├── diabetes_model.pkl  + diabetes_scaler.pkl")
print("  ├── heart_disease_model.pkl + heart_disease_scaler.pkl")
print("  ├── stroke_model.pkl    + stroke_scaler.pkl + stroke_encoders.pkl")
print("  └── ckd_model.pkl       + ckd_scaler.pkl    + ckd_medians.json")
print("\n📊 Model Performance Summary:")
print(f"  Diabetes Model:      AUC = {auc_d:.4f}, Accuracy = {accuracy_d*100:.2f}%")
print(f"  Heart Disease Model: AUC = {auc_h:.4f}, Accuracy = {accuracy_h*100:.2f}%")
print(f"  Stroke Model:        AUC = {auc_s:.4f}, Accuracy = {accuracy_s*100:.2f}%")
print(f"  CKD Model:           AUC = {auc_c:.4f}, Accuracy = {accuracy_c*100:.2f}%")
print("\n✅ All models ready for deployment!")
print("=" * 70)
 
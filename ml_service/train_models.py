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
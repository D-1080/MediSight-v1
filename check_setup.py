#!/usr/bin/env python
import sys

print("="*60)
print("MEDISIGHT ENVIRONMENT CHECK")
print("="*60)

# Python version
print(f"\n✓ Python Version: {sys.version}")
print(f"✓ Python Path: {sys.executable}")

# Check if in virtual environment
if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
    print("✓ Virtual Environment: ACTIVE ✅")
else:
    print("⚠️  Virtual Environment: NOT DETECTED")
    print("   Please activate venv first!")

print("\n" + "="*60)
print("CHECKING CRITICAL DEPENDENCIES")
print("="*60)

dependencies_status = []

# Check core ML libraries
packages = {
    'pandas': 'pandas',
    'numpy': 'numpy',
    'sklearn': 'scikit-learn',
    'xgboost': 'xgboost',
    'shap': 'shap',
    'matplotlib': 'matplotlib',
    'seaborn': 'seaborn',
    'joblib': 'joblib',
    'fastapi': 'fastapi',
    'uvicorn': 'uvicorn',
    'django': 'django',
    'rest_framework': 'djangorestframework',
    'requests': 'requests',
}

for import_name, package_name in packages.items():
    try:
        if import_name == 'sklearn':
            import sklearn as pkg
        elif import_name == 'rest_framework':
            import rest_framework as pkg
        else:
            pkg = __import__(import_name)
        
        version = getattr(pkg, '__version__', 'installed')
        print(f"✅ {package_name:25s} {version}")
        dependencies_status.append(True)
    except ImportError:
        print(f"❌ {package_name:25s} NOT FOUND")
        dependencies_status.append(False)

print("\n" + "="*60)

if all(dependencies_status):
    print("🎉 ALL DEPENDENCIES INSTALLED SUCCESSFULLY!")
    print("✓ Ready to start building MediSight!")
else:
    print("⚠️  Some dependencies are missing.")
    print("   Run: pip install -r requirements.txt")

print("="*60)

# Quick test of critical functionality
print("\nQUICK FUNCTIONALITY TEST")
print("="*60)

try:
    import pandas as pd
    import numpy as np
    from sklearn.ensemble import RandomForestClassifier
    from xgboost import XGBClassifier
    
    # Create dummy data
    X = np.random.rand(100, 5)
    y = np.random.randint(0, 2, 100)
    
    # Test XGBoost
    model = XGBClassifier(n_estimators=10, random_state=42)
    model.fit(X, y)
    pred = model.predict(X[:5])
    
    print("✅ XGBoost: Working")
    print("✅ Scikit-learn: Working")
    print("✅ NumPy: Working")
    print("✅ Pandas: Working")
    
    # Test SHAP
    import shap
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X[:5])
    print("✅ SHAP: Working")
    
    print("\n🚀 EVERYTHING IS READY! You can start training models!")
    
except Exception as e:
    print(f"❌ Error during functionality test: {e}")
    print("   Some libraries may need reinstallation")

print("="*60)
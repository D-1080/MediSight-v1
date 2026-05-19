'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Activity, Brain, TrendingUp, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ModelPerformancePage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // ALL hooks must come before any conditional returns (Rules of Hooks)
  const [activeModel, setActiveModel] = useState('diabetes');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Model metrics data (this will come from backend later)
  const modelMetrics = {
    diabetes: {
      name: 'Diabetes Type 2 Prediction',
      version: 'v1.0.0',
      lastUpdated: '2024-02-10',
      trainingDataset: '768 patient records',
      framework: 'XGBoost + SHAP',
      metrics: [
        { name: 'AUC Score', value: 0.87, target: 0.80, status: 'excellent' },
        { name: 'Precision', value: 0.84, target: 0.75, status: 'good' },
        { name: 'Recall', value: 0.81, target: 0.75, status: 'good' },
        { name: 'F1 Score', value: 0.82, target: 0.75, status: 'good' },
      ],
      confusionMatrix: {
        truePositives: 892,
        falsePositives: 84,
        falseNegatives: 67,
        trueNegatives: 1203,
      },
      featureImportance: [
        { feature: 'Glucose', importance: 0.42 },
        { feature: 'BMI', importance: 0.28 },
        { feature: 'Age', importance: 0.15 },
        { feature: 'Diabetes Pedigree', importance: 0.08 },
        { feature: 'Blood Pressure', importance: 0.07 },
      ],
    },
    heart: {
      name: 'Heart Disease Prediction',
      version: 'v1.0.0',
      lastUpdated: '2024-02-12',
      trainingDataset: '303 patient records',
      framework: 'XGBoost + SHAP',
      metrics: [
        { name: 'AUC Score', value: 0.91, target: 0.80, status: 'excellent' },
        { name: 'Precision', value: 0.88, target: 0.75, status: 'excellent' },
        { name: 'Recall', value: 0.85, target: 0.75, status: 'good' },
        { name: 'F1 Score', value: 0.86, target: 0.75, status: 'good' },
      ],
      confusionMatrix: {
        truePositives: 445,
        falsePositives: 38,
        falseNegatives: 52,
        trueNegatives: 512,
      },
      featureImportance: [
        { feature: 'Chest Pain Type', importance: 0.38 },
        { feature: 'Max Heart Rate', importance: 0.24 },
        { feature: 'ST Depression', importance: 0.18 },
        { feature: 'Number of Vessels', importance: 0.12 },
        { feature: 'Age', importance: 0.08 },
      ],
    },
    stroke: {
      name: 'Stroke Risk Prediction',
      version: 'v1.0.0',
      lastUpdated: '2025-07-01',
      trainingDataset: '5,110 patient records',
      framework: 'XGBoost + SHAP + SMOTE',
      metrics: [
        { name: 'AUC Score', value: 0.85, target: 0.80, status: 'excellent' },
        { name: 'Precision', value: 0.72, target: 0.65, status: 'good' },
        { name: 'Recall',    value: 0.78, target: 0.70, status: 'good' },
        { name: 'F1 Score',  value: 0.75, target: 0.70, status: 'good' },
      ],
      confusionMatrix: {
        truePositives: 186, falsePositives: 71,
        falseNegatives: 52, trueNegatives: 1713,
      },
      featureImportance: [
        { feature: 'Age',               importance: 0.38 },
        { feature: 'Avg Glucose Level', importance: 0.26 },
        { feature: 'BMI',               importance: 0.16 },
        { feature: 'Hypertension',      importance: 0.11 },
        { feature: 'Heart Disease',     importance: 0.09 },
      ],
    },
    ckd: {
      name: 'Chronic Kidney Disease Prediction',
      version: 'v1.0.0',
      lastUpdated: '2025-07-01',
      trainingDataset: '400 patient records',
      framework: 'XGBoost + SHAP',
      metrics: [
        { name: 'AUC Score', value: 0.99, target: 0.90, status: 'excellent' },
        { name: 'Precision', value: 0.98, target: 0.85, status: 'excellent' },
        { name: 'Recall',    value: 0.97, target: 0.85, status: 'excellent' },
        { name: 'F1 Score',  value: 0.97, target: 0.85, status: 'excellent' },
      ],
      confusionMatrix: {
        truePositives: 146, falsePositives: 3,
        falseNegatives: 4,  trueNegatives: 87,
      },
      featureImportance: [
        { feature: 'Haemoglobin',      importance: 0.31 },
        { feature: 'Serum Creatinine', importance: 0.27 },
        { feature: 'Packed Cell Vol.', importance: 0.18 },
        { feature: 'Blood Urea',       importance: 0.13 },
        { feature: 'Specific Gravity', importance: 0.11 },
      ],
    },
  };

  const currentModel = modelMetrics[activeModel as keyof typeof modelMetrics];

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">MediSight</h1>
              <p className="text-gray-400 text-sm">AI-Powered Clinical Decision Support</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Link href="/">
              <button className="px-6 py-2 rounded-lg transition bg-gray-900 text-gray-400 hover:text-white flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Model Performance Monitoring</h2>
        <p className="text-gray-400">Track ML model metrics and performance over time</p>
      </div>

      {/* Model Selection Tabs */}
      <div className="flex gap-2 mb-8">
        {[
          { id: 'diabetes', label: 'Diabetes' },
          { id: 'heart',    label: 'Heart Disease' },
          { id: 'stroke',   label: 'Stroke' },
          { id: 'ckd',      label: 'Kidney Disease' },
        ].map((model) => (
          <button
            key={model.id}
            onClick={() => setActiveModel(model.id)}
            className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
              activeModel === model.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-900 text-gray-400 hover:text-white'
            }`}
          >
            <Brain className="w-4 h-4" />
            {model.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {/* Model Info Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">{currentModel.name}</h3>
              <p className="text-gray-400 text-sm mt-1">Active Production Model</p>
            </div>
            <div className="px-4 py-2 bg-green-900 text-green-200 rounded-lg border border-green-700 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Active</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">Model Version</p>
              <p className="text-white font-mono">{currentModel.version}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Last Updated</p>
              <p className="text-white">{currentModel.lastUpdated}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Training Dataset</p>
              <p className="text-white">{currentModel.trainingDataset}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Framework</p>
              <p className="text-white">{currentModel.framework}</p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-6">
          {currentModel.metrics.map((metric, idx) => (
            <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-400">{metric.name}</h3>
                {metric.status === 'excellent' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <p className="text-3xl font-bold text-white mb-2">{metric.value.toFixed(2)}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${metric.status === 'excellent' ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${(metric.value / 1) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">Target: {metric.target}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Confusion Matrix */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Confusion Matrix</h3>
          <div className="flex items-center justify-center">
            <div className="grid grid-cols-2 gap-4 max-w-2xl w-full">
              <div className="bg-green-900 border border-green-700 rounded-lg p-8 text-center">
                <p className="text-4xl font-bold text-green-200 mb-2">
                  {currentModel.confusionMatrix.truePositives.toLocaleString()}
                </p>
                <p className="text-sm text-green-300 font-medium">True Positives</p>
                <p className="text-xs text-green-400 mt-1">Correctly identified as positive</p>
              </div>
              <div className="bg-red-900 border border-red-700 rounded-lg p-8 text-center">
                <p className="text-4xl font-bold text-red-200 mb-2">
                  {currentModel.confusionMatrix.falsePositives.toLocaleString()}
                </p>
                <p className="text-sm text-red-300 font-medium">False Positives</p>
                <p className="text-xs text-red-400 mt-1">Incorrectly identified as positive</p>
              </div>
              <div className="bg-red-900 border border-red-700 rounded-lg p-8 text-center">
                <p className="text-4xl font-bold text-red-200 mb-2">
                  {currentModel.confusionMatrix.falseNegatives.toLocaleString()}
                </p>
                <p className="text-sm text-red-300 font-medium">False Negatives</p>
                <p className="text-xs text-red-400 mt-1">Incorrectly identified as negative</p>
              </div>
              <div className="bg-green-900 border border-green-700 rounded-lg p-8 text-center">
                <p className="text-4xl font-bold text-green-200 mb-2">
                  {currentModel.confusionMatrix.trueNegatives.toLocaleString()}
                </p>
                <p className="text-sm text-green-300 font-medium">True Negatives</p>
                <p className="text-xs text-green-400 mt-1">Correctly identified as negative</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Importance */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Feature Importance</h3>
          <div className="space-y-4">
            {currentModel.featureImportance.map((feature, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-300 font-medium">{feature.feature}</span>
                  <span className="text-sm text-blue-400 font-bold">
                    {(feature.importance * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all"
                    style={{ width: `${feature.importance * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Over Time Placeholder */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Performance Over Time</h3>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
            <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Performance charts coming soon</p>
            <p className="text-sm text-gray-500 mt-2">
              Track model accuracy, AUC, and drift over time
            </p>
          </div>
        </div>

        {/* Model Deployment Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Deployment Information</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">Environment</p>
              <p className="text-white font-medium">Production</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Endpoint</p>
              <p className="text-white font-mono text-sm">http://localhost:8000/api/predictions/</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Average Response Time</p>
              <p className="text-white font-medium">&lt; 2 seconds</p>
            </div>
          </div>
        </div>

        {/* Model Comparison */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Model Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Metric</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-300">Diabetes</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-300">Heart Disease</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-300">Stroke</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-300">Kidney (CKD)</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-300">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                <tr className="hover:bg-gray-800 transition">
                  <td className="px-6 py-4 text-sm text-white">AUC Score</td>
                  <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-green-900 text-green-200 font-bold rounded-full text-sm">0.87</span></td>
                  <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-green-900 text-green-200 font-bold rounded-full text-sm">0.91</span></td>
                  <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-sm">0.85</span></td>
                  <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-green-900 text-green-200 font-bold rounded-full text-sm">0.99</span></td>
                  <td className="px-6 py-4 text-center text-gray-400">0.80</td>
                </tr>
                <tr className="hover:bg-gray-800 transition">
                  <td className="px-6 py-4 text-sm text-white">Precision</td>
                  <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-green-900 text-green-200 font-bold rounded-full text-sm">0.84</span></td>
                  <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-green-900 text-green-200 font-bold rounded-full text-sm">0.88</span></td>
                  <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-sm">0.72</span></td>
                  <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-green-900 text-green-200 font-bold rounded-full text-sm">0.98</span></td>
                  <td className="px-6 py-4 text-center text-gray-400">0.75</td>
                </tr>
                <tr className="hover:bg-gray-800 transition">
                  <td className="px-6 py-4 text-sm text-white">Recall</td>
                  <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-green-900 text-green-200 font-bold rounded-full text-sm">0.81</span></td>
                  <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-green-900 text-green-200 font-bold rounded-full text-sm">0.85</span></td>
                  <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-sm">0.78</span></td>
                  <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-green-900 text-green-200 font-bold rounded-full text-sm">0.97</span></td>
                  <td className="px-6 py-4 text-center text-gray-400">0.75</td>
                </tr>
                <tr className="hover:bg-gray-800 transition">
                  <td className="px-6 py-4 text-sm text-white">F1 Score</td>
                  <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-green-900 text-green-200 font-bold rounded-full text-sm">0.82</span></td>
                  <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-green-900 text-green-200 font-bold rounded-full text-sm">0.86</span></td>
                  <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-sm">0.75</span></td>
                  <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-green-900 text-green-200 font-bold rounded-full text-sm">0.97</span></td>
                  <td className="px-6 py-4 text-center text-gray-400">0.75</td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
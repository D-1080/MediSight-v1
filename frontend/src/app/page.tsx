'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Activity, Users, TrendingUp, BarChart3, Plus, Upload, FileText, Clock, CheckCircle, AlertCircle, Eye, Brain, Download, XCircle, LogOut } from 'lucide-react';
import { patientService, predictionService } from '@/lib/services';
import { Prediction, Statistics } from '@/types';
import { generatePredictionReport, generateBatchReport } from '@/lib/pdfService';
import { exportPredictionsToCSV, exportPredictionsDetailedCSV } from '@/lib/csvService';
import { exportSHAPValuesToCSV } from '@/lib/csvService';
import Link from 'next/link';

export default function MediSightDashboard() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  
  const [activeView, setActiveView] = useState('dashboard');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total_patients: 0,
    active_cases: 0,
    predictions_today: 0,
    total_predictions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);
  
  useEffect(() => {
  if (isAuthenticated) {
    fetchData();
  }
  }, [isAuthenticated]);

  
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const predictionsData = await predictionService.getAll();
      setPredictions(Array.isArray(predictionsData) ? predictionsData : []);
      
      const [patientStats, predictionStats] = await Promise.all([
        patientService.getStatistics(),
        predictionService.getStatistics(),
      ]);
      
      setStatistics({
        total_patients: patientStats.total_patients || 0,
        active_cases: patientStats.active_cases || 0,
        predictions_today: predictionStats.predictions_today || 0,
        total_predictions: predictionStats.total_predictions || 0,
      });
    } catch (error) {
      console.error('Error:', error);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };
  
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'HIGH': return 'bg-red-600';
      case 'MEDIUM': return 'bg-yellow-600';
      case 'LOW': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };
  
  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'HIGH': return 'bg-red-900 text-red-200 border-red-700';
      case 'MEDIUM': return 'bg-yellow-900 text-yellow-200 border-yellow-700';
      case 'LOW': return 'bg-green-900 text-green-200 border-green-700';
      default: return 'bg-gray-900 text-gray-200 border-gray-700';
    }
  };

  const diseaseLabels: Record<string, string> = {
    DIABETES: 'Diabetes Type 2',
    HEART: 'Heart Disease',
    STROKE: 'Stroke',
    CKD: 'Chronic Kidney Disease',
  };
  
  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  // ✅ MAIN RENDER - AFTER ALL HOOKS AND CONDITIONALS
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
          <div className="flex items-center gap-4">
            {/* User Info */}
            <div className="text-right">
              <p className="text-white font-medium">{user.first_name} {user.last_name}</p>
              <p className="text-sm text-gray-400">{user.role}</p>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="px-4 py-2 bg-gray-900 text-gray-400 hover:text-white rounded-lg transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
        {/* Navigation Tabs */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`px-6 py-2 rounded-lg transition ${
              activeView === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <Link href="/patients">
            <button className="px-6 py-2 rounded-lg transition bg-gray-900 text-gray-400 hover:text-white flex items-center gap-2">
              <Users className="w-4 h-4" />
              Patients
            </button>
          </Link>
          <Link href="/models">
            <button className="px-6 py-2 rounded-lg transition bg-gray-900 text-gray-400 hover:text-white flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Model Performance
            </button>
          </Link>
        </div>
      </header>

      {/* Dashboard View */}
      {activeView === 'dashboard' && (
        loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-blue-600">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-white">{statistics.total_patients}</p>
                  <p className="text-gray-400 font-medium">Total Patients</p>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-purple-600">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-white">{statistics.active_cases}</p>
                  <p className="text-gray-400 font-medium">Active Cases</p>
                  <p className="text-sm text-gray-500">Under monitoring</p>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-green-600">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-white">{statistics.predictions_today}</p>
                  <p className="text-gray-400 font-medium">Predictions Today</p>
                  <p className="text-sm text-gray-500">Response time: &lt;2s</p>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-orange-600">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-white">87.3%</p>
                  <p className="text-gray-400 font-medium">Model Accuracy</p>
                  <p className="text-sm text-gray-500">AUC Score: 0.87</p>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-3 gap-6">
              {/* Recent Predictions */}
              <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">Recent Predictions</h2>
                    <p className="text-sm text-gray-400 mt-1">Latest AI-powered disease risk assessments</p>
                  </div>
                  <div className="flex gap-2">
                    {predictions.length > 0 && (
                      <>
                        {/* CSV Export Dropdown */}
                        <div className="relative group">
                          <button className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Export CSV
                          </button>
                          <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button
                              onClick={() => exportPredictionsToCSV(predictions)}
                              className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition rounded-t-lg"
                            >
                              <p className="font-medium">Standard CSV</p>
                              <p className="text-xs text-gray-400">Basic prediction data</p>
                            </button>
                            <button
                              onClick={() => exportPredictionsDetailedCSV(predictions)}
                              className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition rounded-b-lg"
                            >
                              <p className="font-medium">Detailed CSV</p>
                              <p className="text-xs text-gray-400">With SHAP values</p>
                            </button>
                          </div>
                        </div>

                        {/* PDF Export */}
                        <button 
                          onClick={() => generateBatchReport(predictions)}
                          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Export PDF
                        </button>
                      </>
                    )}
                    <Link href="/predictions/new">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        New Prediction
                      </button>
                    </Link>
                  </div>
                </div>

                {/* <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">Recent Predictions</h2>
                    <p className="text-sm text-gray-400 mt-1">Latest AI-powered disease risk assessments</p>
                  </div>
                  <div className="flex gap-2">
                    {predictions.length > 0 && (
                      <button 
                        onClick={() => {
                          const { generateBatchReport } = require('@/lib/pdfService');
                          generateBatchReport(predictions);
                        }}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export All
                      </button>
                    )}
                    <Link href="/predictions/new">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        New Prediction
                      </button>
                    </Link>
                  </div>
                </div> */}
                
                {/* <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">Recent Predictions</h2>
                    <p className="text-sm text-gray-400 mt-1">Latest AI-powered disease risk assessments</p>
                  </div>
                  <Link href="/predictions/new">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      New Prediction
                    </button>
                  </Link>
                </div> */}

                <div className="space-y-3">
                  {predictions.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-400">No predictions yet</p>
                      <p className="text-sm text-gray-500 mt-2">Create your first prediction to get started</p>
                    </div>
                  ) : (
                    predictions.slice(0, 5).map((pred) => (
                      <div 
                        key={pred.id}
                        onClick={() => setSelectedPrediction(pred)}
                        className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-white">
                                {pred.patient_details.first_name} {pred.patient_details.last_name}
                              </h3>
                              <span className="text-xs text-gray-400">{pred.patient_details.patient_id}</span>
                              <span className={`px-2 py-1 rounded-full text-xs border ${getRiskBadgeColor(pred.risk_level)}`}>
                                {pred.risk_level} Risk
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 mb-2">{diseaseLabels[pred.disease_type]}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(pred.created_at).toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                {pred.status === 'REVIEWED' ? (
                                  <><CheckCircle className="w-3 h-3 text-green-500" /> Reviewed</>
                                ) : (
                                  <><AlertCircle className="w-3 h-3 text-yellow-500" /> Pending Review</>
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-white">{pred.probability.toFixed(0)}%</p>
                              <p className="text-xs text-gray-400">Probability</p>
                            </div>
                            <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              View SHAP
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getRiskColor(pred.risk_level)} transition-all`}
                            style={{ width: `${pred.probability}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" />
                      New Patient
                    </button>
                    <button className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Records
                    </button>
                    <button className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2">
                      <FileText className="w-4 h-4" />
                      Generate Report
                    </button>
                    <button className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      View Analytics
                    </button>
                  </div>
                </div>

                {/* System Status */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">System Status</h3>
                  <div className="space-y-3">
                    {['ML Service', 'Database', 'Redis Cache', 'MLflow'].map((service) => (
                      <div key={service} className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">{service}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-xs text-green-400">Online</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Patients View Placeholder */}
      {activeView === 'patients' && (
        <div className="text-center py-20">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Patient Management</h2>
          <p className="text-gray-400">Coming soon...</p>
        </div>
      )}

      {/* Model Performance View Placeholder */}
      {activeView === 'models' && (
        <div className="text-center py-20">
          <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Model Performance</h2>
          <p className="text-gray-400">Coming soon...</p>
        </div>
      )}

      {/* Prediction Detail Modal */}
      {selectedPrediction && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {selectedPrediction.patient_details.first_name} {selectedPrediction.patient_details.last_name}
                </h3>
                <p className="text-gray-400">{selectedPrediction.patient_details.patient_id}</p>
              </div>
              <button
                onClick={() => setSelectedPrediction(null)}
                className="text-gray-400 hover:text-white transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Prediction Summary */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Prediction Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Disease</p>
                    <p className="text-white font-medium">{diseaseLabels[selectedPrediction.disease_type]}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Risk Level</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm border ${getRiskBadgeColor(selectedPrediction.risk_level)}`}>
                      {selectedPrediction.risk_level} Risk
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Probability</p>
                    <p className="text-white font-medium">{selectedPrediction.probability.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Prediction Time</p>
                    <p className="text-white font-medium">{new Date(selectedPrediction.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* SHAP Explainability */}
              {selectedPrediction.shap_values && selectedPrediction.shap_values.length > 0 && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-400" />
                    SHAP Explainability (Top Features)
                  </h4>
                  <div className="space-y-3">
                    {selectedPrediction.shap_values.slice(0, 5).map((shap, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-300">{shap.feature}</span>
                          <span className={`text-sm ${shap.shap_value > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {shap.shap_value > 0 ? '+' : ''}{shap.shap_value.toFixed(3)}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${shap.shap_value > 0 ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(Math.abs(shap.shap_value) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {/* Actions */}
              <div className="flex gap-3">
                <button 
                  onClick={() => generatePredictionReport(selectedPrediction)}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button 
                  onClick={() => exportSHAPValuesToCSV(selectedPrediction)}
                  className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Export SHAP CSV
                </button>
              </div>

              {/* <div className="flex gap-3">
                <button onClick={() => generatePredictionReport(selectedPrediction)}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Download PDF Report
                </button>
                <button className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition">
                  Mark as Reviewed
                </button>
              </div> */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
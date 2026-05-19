'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Activity, Users, TrendingUp, BarChart3, Plus, FileText, Clock, CheckCircle, AlertCircle, Eye, Brain, Download, XCircle, LogOut, RefreshCw, Stethoscope } from 'lucide-react';
import { patientService, predictionService } from '@/lib/services';
import { Prediction, Statistics } from '@/types';
import { generatePredictionReport, generateBatchReport } from '@/lib/pdfService';
import { exportPredictionsToCSV, exportPredictionsDetailedCSV } from '@/lib/csvService';
import { exportSHAPValuesToCSV } from '@/lib/csvService';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'checking';
  latency?: number;
}

const ML_SERVICE_URL = process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:8001';

const rolePermissions: Record<string, string[]> = {
  ADMIN: [
    'VIEW_ALL_PATIENTS',
    'CREATE_PREDICTION',
    'VIEW_MODEL_REGISTRY',
    'CREATE_PATIENT',
    'EXPORT_PREDICTION',
    'VIEW_SYSTEM_STATUS',
  ],
  DOCTOR: [
    'VIEW_ALL_PATIENTS',
    'CREATE_PREDICTION',
    'VIEW_MODEL_REGISTRY',
    'CREATE_PATIENT',
    'EXPORT_PREDICTION',
  ],
  ANALYST: [
    'VIEW_MODEL_REGISTRY',
  ],
  PATIENT: [],
};

const can = (role: string, permission: string) => {
  return rolePermissions[role]?.includes(permission) ?? false;
};

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
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState<ServiceStatus[]>([
    { name: 'ML Service',  status: 'checking' },
    { name: 'Django API',  status: 'checking' },
    { name: 'Database',    status: 'checking' },
  ]);
  const [statusLoading, setStatusLoading] = useState(false);

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
      // Role-aware fetch
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      let predictionsData;
      if (storedUser.role === 'PATIENT') {
        predictionsData = await predictionService.getMyPredictions();
      } else {
        predictionsData = await predictionService.getAll();
      }
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
  

  // ── System Status ─────────────────────────────────────────────────────────
  const fetchSystemStatus = useCallback(async () => {
    setStatusLoading(true);
    const results: ServiceStatus[] = [];

    // Ping ML Service
    try {
      const t0 = Date.now();
      const res = await fetch(`${ML_SERVICE_URL}/health`, { signal: AbortSignal.timeout(4000) });
      const latency = Date.now() - t0;
      results.push({ name: 'ML Service', status: res.ok ? 'online' : 'offline', latency });
    } catch {
      results.push({ name: 'ML Service', status: 'offline' });
    }

    // Ping Django API
    try {
      const t0 = Date.now();
      const res = await fetch('http://localhost:8000/', { signal: AbortSignal.timeout(4000) });
      const latency = Date.now() - t0;
      results.push({ name: 'Django API', status: res.ok ? 'online' : 'offline', latency });
    } catch {
      results.push({ name: 'Django API', status: 'offline' });
    }

    // Database health is inferred from Django API — if API is up, DB is up
    const apiUp = results.find(r => r.name === 'Django API')?.status === 'online';
    results.push({ name: 'Database', status: apiUp ? 'online' : 'offline' });

    setSystemStatus(results);
    setStatusLoading(false);
  }, []);

  // Fetch status on mount and every 30s
  useEffect(() => {
    if (isAuthenticated) {
      fetchSystemStatus();
      const interval = setInterval(fetchSystemStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchSystemStatus]);

  // ── Mark as Reviewed ──────────────────────────────────────────────────────
  const handleMarkReviewed = async () => {
    if (!selectedPrediction) return;
    setReviewLoading(true);
    try {
      await predictionService.updateStatus(selectedPrediction.id, 'REVIEWED', reviewNotes);
      // Update local state so UI reflects change immediately
      setPredictions(prev =>
        prev.map(p => p.id === selectedPrediction.id ? { ...p, status: 'REVIEWED' as const } : p)
      );
      setSelectedPrediction(prev => prev ? { ...prev, status: 'REVIEWED' as const } : null);
      setReviewNotes('');
    } catch (err) {
      console.error('Failed to mark as reviewed:', err);
    } finally {
      setReviewLoading(false);
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
        {/* Navigation Tabs — role-aware */}
        <div className="flex items-center gap-2">
          {/* Dashboard — all roles */}
          <button onClick={() => setActiveView('dashboard')}
            className={`px-5 py-2 rounded-lg transition text-sm font-medium flex items-center gap-2 ${
              activeView === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white'
            }`}>
            <BarChart3 className="w-4 h-4" /> Dashboard
          </button>

          {/* Patients — Admin + Doctor */}
          {user && can(user.role, 'VIEW_ALL_PATIENTS') && (
            <Link href="/patients">
              <button className="px-5 py-2 rounded-lg transition text-sm font-medium bg-gray-900 text-gray-400 hover:text-white flex items-center gap-2">
                <Users className="w-4 h-4" /> Patients
              </button>
            </Link>
          )}

          {/* New Prediction — Admin + Doctor */}
          {user && can(user.role, 'CREATE_PREDICTION') && (
            <Link href="/predictions/new">
              <button className="px-5 py-2 rounded-lg transition text-sm font-medium bg-gray-900 text-gray-400 hover:text-white flex items-center gap-2">
                <Brain className="w-4 h-4" /> New Prediction
              </button>
            </Link>
          )}

          {/* Model Registry — Admin + Analyst + Doctor */}
          {user && can(user.role, 'VIEW_MODEL_REGISTRY') && (
            <Link href="/models">
              <button className="px-5 py-2 rounded-lg transition text-sm font-medium bg-gray-900 text-gray-400 hover:text-white flex items-center gap-2">
                <Activity className="w-4 h-4" /> Models
              </button>
            </Link>
          )}

          {/* My Reports — Patient only */}
          {user?.role === 'PATIENT' && (
            <button onClick={() => setActiveView('my-reports')}
              className={`px-5 py-2 rounded-lg transition text-sm font-medium flex items-center gap-2 ${
                activeView === 'my-reports' ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white'
              }`}>
              <FileText className="w-4 h-4" /> My Reports
            </button>
          )}
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
                    {predictions.length > 0 && user && can(user.role, 'EXPORT_PREDICTION') && (
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
                    {user && can(user.role, 'CREATE_PREDICTION') && (
                      <Link href="/predictions/new">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          New Prediction
                        </button>
                      </Link>
                    )}
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
                    {user && can(user.role, 'CREATE_PREDICTION') && (
                      <Link href="/predictions/new">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          New Prediction
                        </button>
                      </Link>
                    )}
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
                    {/* Admin + Doctor actions */}
                    {user && can(user.role, 'CREATE_PATIENT') && (
                      <Link href="/patients" className="block">
                        <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
                          <Plus className="w-4 h-4" />
                          New Patient
                        </button>
                      </Link>
                    )}
                    {user && can(user.role, 'CREATE_PREDICTION') && (
                      <Link href="/predictions/new" className="block">
                        <button className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2">
                          <Brain className="w-4 h-4" />
                          New Prediction
                        </button>
                      </Link>
                    )}
                    {user && can(user.role, 'EXPORT_PREDICTION') && (
                      <button
                        onClick={() => predictions.length > 0 && generateBatchReport(predictions)}
                        disabled={predictions.length === 0}
                        className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <FileText className="w-4 h-4" />
                        Export PDF Report
                      </button>
                    )}
                    {/* All roles can view models */}
                    {user && can(user.role, 'VIEW_MODEL_REGISTRY') && (
                      <Link href="/models" className="block">
                        <button className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2">
                          <Stethoscope className="w-4 h-4" />
                          Model Performance
                        </button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* System Status — Admin only */}
                {user && can(user.role, 'VIEW_SYSTEM_STATUS') && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">System Status</h3>
                    <button
                      onClick={fetchSystemStatus}
                      disabled={statusLoading}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition disabled:opacity-40"
                      title="Refresh status"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${statusLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {systemStatus.map((svc) => (
                      <div key={svc.name} className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">{svc.name}</span>
                        <div className="flex items-center gap-2">
                          {svc.status === 'checking' ? (
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" />
                          ) : svc.status === 'online' ? (
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          ) : (
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                          )}
                          <span className={`text-xs font-medium ${
                            svc.status === 'checking' ? 'text-gray-400' :
                            svc.status === 'online'   ? 'text-green-400' :
                                                        'text-red-400'
                          }`}>
                            {svc.status === 'checking' ? 'Checking…' :
                             svc.status === 'online'   ? `Online${svc.latency ? ` · ${svc.latency}ms` : ''}` :
                                                         'Offline'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                )}{/* End admin-only System Status */}
              </div>
            </div>
          </div>
        )
      )}

      {/* Patients View Placeholder */}
      {/* Patient-only: My Reports view */}
      {activeView === 'my-reports' && user?.role === 'PATIENT' && (
        <div className="grid grid-cols-1 gap-6 p-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <FileText className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">My Health Reports</h2>
            <p className="text-gray-400 text-sm mb-6">Your prediction history and risk assessments will appear here. Contact your doctor to run a new assessment.</p>
            <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
              {predictions.length === 0 ? (
                <p className="text-gray-500 text-sm">No reports yet.</p>
              ) : (
                predictions.map(p => (
                  <div key={p.id} className="bg-gray-800 rounded-lg p-4 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium capitalize">{p.disease_type.toLowerCase()}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        p.risk_level === 'HIGH' ? 'bg-red-900 text-red-300' :
                        p.risk_level === 'MEDIUM' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-green-900 text-green-300'
                      }`}>{p.risk_level}</span>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">{new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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

              {/* Export Actions */}
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

              {/* Mark as Reviewed */}
              {selectedPrediction.status !== 'REVIEWED' ? (
                <div className="mt-4 border border-gray-700 rounded-xl p-4 bg-gray-800">
                  <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    Mark as Clinically Reviewed
                  </p>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add clinical notes (optional)…"
                    rows={2}
                    maxLength={500}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none mb-3"
                  />
                  <button
                    onClick={handleMarkReviewed}
                    disabled={reviewLoading}
                    className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {reviewLoading ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</>
                    ) : (
                      <><CheckCircle className="w-4 h-4" /> Mark as Reviewed</>
                    )}
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-2 p-3 bg-green-900 bg-opacity-20 border border-green-700 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <p className="text-sm text-green-300 font-medium">Clinically reviewed</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Activity, Users, ArrowLeft, Brain, Loader, Info } from 'lucide-react';
import { patientService, predictionService } from '@/lib/services';
import { Patient, PatientList } from '@/types';
import Link from 'next/link';

export default function NewPredictionPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

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

  const [patients, setPatients] = useState<PatientList[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [selectedPatientData, setSelectedPatientData] = useState<Patient | null>(null);
  const [selectedDisease, setSelectedDisease] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Disease-specific feature inputs
  const [diabetesData, setDiabetesData] = useState({
    Pregnancies: '',
    Glucose: '',
    BloodPressure: '',
    SkinThickness: '',
    Insulin: '',
    BMI: '',
    DiabetesPedigreeFunction: '',
    Age: '',
  });

  const [heartData, setHeartData] = useState({
    age: '',
    sex: '1',
    cp: '',
    trestbps: '',
    chol: '',
    fbs: '0',
    restecg: '0',
    thalach: '',
    exang: '0',
    oldpeak: '',
    slope: '0',
    ca: '',
    thal: '',
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  // Auto-fill age when patient is selected
  useEffect(() => {
    if (selectedPatientData) {
      const patientAge = selectedPatientData.age.toString();
      
      // Update diabetes data with patient's age
      setDiabetesData(prev => ({
        ...prev,
        Age: patientAge,
        // Reset pregnancies for male patients
        Pregnancies: selectedPatientData.gender === 'M' ? '0' : prev.Pregnancies,
      }));

      // Update heart data with patient's age and sex
      setHeartData(prev => ({
        ...prev,
        age: patientAge,
        sex: selectedPatientData.gender === 'M' ? '1' : '0',
      }));
    }
  }, [selectedPatientData]);

  const fetchPatients = async () => {
    try {
      const data = await patientService.getAll();
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handlePatientSelect = async (patientId: number) => {
    setSelectedPatient(patientId);
    
    // Fetch full patient details
    try {
      const patientDetails = await patientService.getById(patientId);
      setSelectedPatientData(patientDetails);
    } catch (error) {
      console.error('Error fetching patient details:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPatient || !selectedDisease) {
      alert('Please select a patient and disease type');
      return;
    }

    // Validation
    if (selectedDisease === 'DIABETES') {
      const requiredFields = ['Glucose', 'BloodPressure', 'BMI', 'Age'];
      const missingFields = requiredFields.filter(field => !diabetesData[field as keyof typeof diabetesData]);
      
      if (missingFields.length > 0) {
        alert(`Please fill in required fields: ${missingFields.join(', ')}`);
        return;
      }
    } else if (selectedDisease === 'HEART') {
      const requiredFields = ['age', 'cp', 'trestbps', 'chol', 'thalach'];
      const missingFields = requiredFields.filter(field => !heartData[field as keyof typeof heartData]);
      
      if (missingFields.length > 0) {
        alert(`Please fill in required fields: ${missingFields.join(', ')}`);
        return;
      }
    }

    setLoading(true);

    try {
      let inputFeatures: Record<string, any> = {};

      if (selectedDisease === 'DIABETES') {
        inputFeatures = {
          Pregnancies: parseFloat(diabetesData.Pregnancies) || 0,
          Glucose: parseFloat(diabetesData.Glucose) || 0,
          BloodPressure: parseFloat(diabetesData.BloodPressure) || 0,
          SkinThickness: parseFloat(diabetesData.SkinThickness) || 0,
          Insulin: parseFloat(diabetesData.Insulin) || 0,
          BMI: parseFloat(diabetesData.BMI) || 0,
          DiabetesPedigreeFunction: parseFloat(diabetesData.DiabetesPedigreeFunction) || 0,
          Age: parseFloat(diabetesData.Age) || 0,
        };
      } else if (selectedDisease === 'HEART') {
        inputFeatures = {
          age: parseFloat(heartData.age) || 0,
          sex: parseFloat(heartData.sex) || 0,
          cp: parseFloat(heartData.cp) || 0,
          trestbps: parseFloat(heartData.trestbps) || 0,
          chol: parseFloat(heartData.chol) || 0,
          fbs: parseFloat(heartData.fbs) || 0,
          restecg: parseFloat(heartData.restecg) || 0,
          thalach: parseFloat(heartData.thalach) || 0,
          exang: parseFloat(heartData.exang) || 0,
          oldpeak: parseFloat(heartData.oldpeak) || 0,
          slope: parseFloat(heartData.slope) || 0,
          ca: parseFloat(heartData.ca) || 0,
          thal: parseFloat(heartData.thal) || 0,
        };
      }

      await predictionService.create({
        patient_id: selectedPatient,
        disease_type: selectedDisease,
        input_features: inputFeatures,
      });

      alert('Prediction created successfully!');
      router.push('/');
    } catch (error) {
      console.error('Error creating prediction:', error);
      alert('Failed to create prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const diseases = [
    { value: 'DIABETES', label: 'Diabetes Type 2', description: 'Predict diabetes risk based on clinical measurements' },
    { value: 'HEART', label: 'Heart Disease', description: 'Assess cardiovascular disease risk' },
    { value: 'STROKE', label: 'Stroke', description: 'Evaluate stroke probability' },
    { value: 'CKD', label: 'Chronic Kidney Disease', description: 'Determine CKD likelihood' },
  ];

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
          <Link href="/">
            <button className="px-6 py-2 rounded-lg transition bg-gray-900 text-gray-400 hover:text-white flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </Link>
        </div>
      </header>

      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Create New Prediction</h2>
        <p className="text-gray-400">Follow the steps to generate an AI-powered disease risk assessment</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                step >= s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
              }`}>
                {s}
              </div>
              {s < 3 && (
                <div className={`w-24 h-1 transition ${
                  step > s ? 'bg-blue-600' : 'bg-gray-800'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4 px-12">
          <span className={`text-sm ${step >= 1 ? 'text-blue-400' : 'text-gray-400'}`}>Select Patient</span>
          <span className={`text-sm ${step >= 2 ? 'text-blue-400' : 'text-gray-400'}`}>Choose Disease</span>
          <span className={`text-sm ${step >= 3 ? 'text-blue-400' : 'text-gray-400'}`}>Input Features</span>
        </div>
      </div>

      {/* Step 1: Select Patient */}
      {step === 1 && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
            <h3 className="text-xl font-bold text-white mb-6">Select Patient</h3>
            
            {patients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No patients found</p>
                <Link href="/patients">
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    Add New Patient
                  </button>
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                  {patients.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => handlePatientSelect(patient.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                        selectedPatient === patient.id
                          ? 'border-blue-600 bg-blue-900 bg-opacity-20'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-white">
                            {patient.first_name} {patient.last_name}
                          </h4>
                          <p className="text-sm text-gray-400">{patient.patient_id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">Age: {patient.age}</p>
                          <p className="text-sm text-gray-400">
                            {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedPatientData && (
                  <div className="mt-6 p-4 bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-200 font-medium">Patient Selected</p>
                        <p className="text-xs text-blue-300 mt-1">
                          Age and gender will be automatically filled in the prediction form
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedPatient}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Choose Disease
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Select Disease */}
      {step === 2 && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
            <h3 className="text-xl font-bold text-white mb-6">Choose Disease Type</h3>
            <div className="grid grid-cols-2 gap-4">
              {diseases.map((disease) => (
                <div
                  key={disease.value}
                  onClick={() => setSelectedDisease(disease.value)}
                  className={`p-6 rounded-lg border-2 cursor-pointer transition ${
                    selectedDisease === disease.value
                      ? 'border-blue-600 bg-blue-900 bg-opacity-20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Brain className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-white mb-1">{disease.label}</h4>
                      <p className="text-sm text-gray-400">{disease.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedDisease}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Input Features
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Input Features */}
      {step === 3 && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Input Clinical Features - {diseases.find(d => d.value === selectedDisease)?.label}
                </h3>
                {selectedPatientData && (
                  <p className="text-sm text-gray-400 mt-1">
                    Patient: {selectedPatientData.full_name} • Age: {selectedPatientData.age} • 
                    Gender: {selectedPatientData.gender === 'M' ? 'Male' : selectedPatientData.gender === 'F' ? 'Female' : 'Other'}
                  </p>
                )}
              </div>
            </div>

            {/* Auto-fill notification */}
            {selectedPatientData && (
              <div className="mb-6 p-4 bg-green-900 bg-opacity-20 border border-green-700 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-200 font-medium">Auto-filled Information</p>
                    <p className="text-xs text-green-300 mt-1">
                      Age ({selectedPatientData.age}) and gender have been automatically filled based on patient data.
                      {selectedPatientData.gender === 'M' && selectedDisease === 'DIABETES' && 
                        ' Pregnancies field is set to 0 for male patients.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Diabetes Features */}
            {selectedDisease === 'DIABETES' && (
              <div className="grid grid-cols-2 gap-4">
                {/* Only show Pregnancies for female patients */}
                {selectedPatientData?.gender !== 'M' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Pregnancies {selectedPatientData?.gender === 'F' && <span className="text-red-400">*</span>}
                    </label>
                    <input
                      type="number"
                      value={diabetesData.Pregnancies}
                      onChange={(e) => setDiabetesData({ ...diabetesData, Pregnancies: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="0-17"
                      min="0"
                      max="17"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Glucose (mg/dL) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={diabetesData.Glucose}
                    onChange={(e) => setDiabetesData({ ...diabetesData, Glucose: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="70-200"
                    min="0"
                    max="200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Blood Pressure (mm Hg) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={diabetesData.BloodPressure}
                    onChange={(e) => setDiabetesData({ ...diabetesData, BloodPressure: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="60-122"
                    min="0"
                    max="200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Skin Thickness (mm)</label>
                  <input
                    type="number"
                    value={diabetesData.SkinThickness}
                    onChange={(e) => setDiabetesData({ ...diabetesData, SkinThickness: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="0-99"
                    min="0"
                    max="99"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Insulin (mu U/ml)</label>
                  <input
                    type="number"
                    value={diabetesData.Insulin}
                    onChange={(e) => setDiabetesData({ ...diabetesData, Insulin: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="0-846"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    BMI <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    value={diabetesData.BMI}
                    onChange={(e) => setDiabetesData({ ...diabetesData, BMI: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="15-67"
                    min="10"
                    max="70"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Diabetes Pedigree Function</label>
                  <input
                    type="number"
                    step="0.001"
                    value={diabetesData.DiabetesPedigreeFunction}
                    onChange={(e) => setDiabetesData({ ...diabetesData, DiabetesPedigreeFunction: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="0.078-2.42"
                    min="0"
                    max="3"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Age <span className="text-blue-400">(Auto-filled)</span>
                  </label>
                  <input
                    type="number"
                    value={diabetesData.Age}
                    disabled
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            {/* Heart Disease Features */}
            {selectedDisease === 'HEART' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Age <span className="text-blue-400">(Auto-filled)</span>
                  </label>
                  <input
                    type="number"
                    value={heartData.age}
                    disabled
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sex <span className="text-blue-400">(Auto-filled)</span>
                  </label>
                  <input
                    type="text"
                    value={heartData.sex === '1' ? 'Male' : 'Female'}
                    disabled
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Chest Pain Type (0-3) <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={heartData.cp}
                    onChange={(e) => setHeartData({ ...heartData, cp: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select type</option>
                    <option value="0">0 - Typical Angina</option>
                    <option value="1">1 - Atypical Angina</option>
                    <option value="2">2 - Non-anginal Pain</option>
                    <option value="3">3 - Asymptomatic</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Resting Blood Pressure (mm Hg) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={heartData.trestbps}
                    onChange={(e) => setHeartData({ ...heartData, trestbps: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="94-200"
                    min="80"
                    max="220"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Cholesterol (mg/dl) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={heartData.chol}
                    onChange={(e) => setHeartData({ ...heartData, chol: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="126-564"
                    min="100"
                    max="600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Heart Rate <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={heartData.thalach}
                    onChange={(e) => setHeartData({ ...heartData, thalach: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="71-202"
                    min="60"
                    max="220"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ST Depression</label>
                  <input
                    type="number"
                    step="0.1"
                    value={heartData.oldpeak}
                    onChange={(e) => setHeartData({ ...heartData, oldpeak: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="0-6.2"
                    min="0"
                    max="10"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Number of Major Vessels (0-3)</label>
                  <select
                    value={heartData.ca}
                    onChange={(e) => setHeartData({ ...heartData, ca: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select</option>
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Thalassemia (1-3)</label>
                  <select
                    value={heartData.thal}
                    onChange={(e) => setHeartData({ ...heartData, thal: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select</option>
                    <option value="1">1 - Normal</option>
                    <option value="2">2 - Fixed Defect</option>
                    <option value="3">3 - Reversible Defect</option>
                  </select>
                </div>
              </div>
            )}

            {/* Placeholder for other diseases */}
            {(selectedDisease === 'STROKE' || selectedDisease === 'CKD') && (
              <div className="text-center py-12">
                <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Feature input form for {selectedDisease} coming soon...</p>
                <p className="text-sm text-gray-500 mt-2">Currently supporting Diabetes and Heart Disease predictions</p>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || (selectedDisease !== 'DIABETES' && selectedDisease !== 'HEART')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Generating Prediction...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    Generate Prediction
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
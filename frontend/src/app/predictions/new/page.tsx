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

  const [strokeData, setStrokeData] = useState({
    gender: '',
    age: '',
    hypertension: '0',
    heart_disease: '0',
    ever_married: '',
    work_type: '',
    Residence_type: '',
    avg_glucose_level: '',
    bmi: '',
    smoking_status: '',
  });

  const [ckdData, setCkdData] = useState({
    age: '', bp: '', sg: '', al: '', su: '',
    rbc: '', pc: '', pcc: '', ba: '',
    bgr: '', bu: '', sc: '', sod: '', pot: '',
    hemo: '', pcv: '', wc: '', rc: '',
    htn: '', dm: '', cad: '', appet: '', pe: '', ane: '',
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

      // Update stroke data with patient's age and gender
      setStrokeData(prev => ({
        ...prev,
        age: patientAge,
        gender: selectedPatientData.gender === 'M' ? 'Male' : 'Female',
      }));

      // Update CKD data with patient's age
      setCkdData(prev => ({
        ...prev,
        age: patientAge,
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
      } else if (selectedDisease === 'STROKE') {
        inputFeatures = {
          gender:            strokeData.gender,
          age:               parseFloat(strokeData.age) || 0,
          hypertension:      parseInt(strokeData.hypertension) || 0,
          heart_disease:     parseInt(strokeData.heart_disease) || 0,
          ever_married:      strokeData.ever_married,
          work_type:         strokeData.work_type,
          Residence_type:    strokeData.Residence_type,
          avg_glucose_level: parseFloat(strokeData.avg_glucose_level) || 0,
          bmi:               parseFloat(strokeData.bmi) || 0,
          smoking_status:    strokeData.smoking_status,
        };
      } else if (selectedDisease === 'CKD') {
        // Only send fields that have values; backend imputes the rest
        const parseOpt = (v: string) => v === '' ? null : parseFloat(v);
        inputFeatures = {
          age:   parseOpt(ckdData.age),
          bp:    parseOpt(ckdData.bp),
          sg:    parseOpt(ckdData.sg),
          al:    parseOpt(ckdData.al),
          su:    parseOpt(ckdData.su),
          rbc:   parseOpt(ckdData.rbc),
          pc:    parseOpt(ckdData.pc),
          pcc:   parseOpt(ckdData.pcc),
          ba:    parseOpt(ckdData.ba),
          bgr:   parseOpt(ckdData.bgr),
          bu:    parseOpt(ckdData.bu),
          sc:    parseOpt(ckdData.sc),
          sod:   parseOpt(ckdData.sod),
          pot:   parseOpt(ckdData.pot),
          hemo:  parseOpt(ckdData.hemo),
          pcv:   parseOpt(ckdData.pcv),
          wc:    parseOpt(ckdData.wc),
          rc:    parseOpt(ckdData.rc),
          htn:   parseOpt(ckdData.htn),
          dm:    parseOpt(ckdData.dm),
          cad:   parseOpt(ckdData.cad),
          appet: parseOpt(ckdData.appet),
          pe:    parseOpt(ckdData.pe),
          ane:   parseOpt(ckdData.ane),
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

            {/* Stroke Features */}
            {selectedDisease === 'STROKE' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Gender <span className="text-blue-400">(Auto-filled)</span>
                  </label>
                  <input
                    type="text"
                    value={strokeData.gender}
                    disabled
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Age <span className="text-blue-400">(Auto-filled)</span>
                  </label>
                  <input
                    type="number"
                    value={strokeData.age}
                    disabled
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Hypertension <span className="text-red-400">*</span></label>
                  <select value={strokeData.hypertension} onChange={(e) => setStrokeData({ ...strokeData, hypertension: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
                    <option value="0">No</option>
                    <option value="1">Yes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Heart Disease <span className="text-red-400">*</span></label>
                  <select value={strokeData.heart_disease} onChange={(e) => setStrokeData({ ...strokeData, heart_disease: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
                    <option value="0">No</option>
                    <option value="1">Yes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ever Married <span className="text-red-400">*</span></label>
                  <select value={strokeData.ever_married} onChange={(e) => setStrokeData({ ...strokeData, ever_married: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Work Type <span className="text-red-400">*</span></label>
                  <select value={strokeData.work_type} onChange={(e) => setStrokeData({ ...strokeData, work_type: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
                    <option value="">Select</option>
                    <option value="Private">Private</option>
                    <option value="Self-employed">Self-employed</option>
                    <option value="Govt_job">Government Job</option>
                    <option value="children">Children</option>
                    <option value="Never_worked">Never Worked</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Residence Type <span className="text-red-400">*</span></label>
                  <select value={strokeData.Residence_type} onChange={(e) => setStrokeData({ ...strokeData, Residence_type: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
                    <option value="">Select</option>
                    <option value="Urban">Urban</option>
                    <option value="Rural">Rural</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Avg. Glucose Level (mg/dL) <span className="text-red-400">*</span></label>
                  <input type="number" step="0.1" placeholder="50–300"
                    value={strokeData.avg_glucose_level} onChange={(e) => setStrokeData({ ...strokeData, avg_glucose_level: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">BMI <span className="text-red-400">*</span></label>
                  <input type="number" step="0.1" placeholder="10–70"
                    value={strokeData.bmi} onChange={(e) => setStrokeData({ ...strokeData, bmi: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Smoking Status <span className="text-red-400">*</span></label>
                  <select value={strokeData.smoking_status} onChange={(e) => setStrokeData({ ...strokeData, smoking_status: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
                    <option value="">Select</option>
                    <option value="never smoked">Never Smoked</option>
                    <option value="formerly smoked">Formerly Smoked</option>
                    <option value="smokes">Currently Smokes</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
              </div>
            )}

            {/* CKD Features */}
            {selectedDisease === 'CKD' && (
              <div>
                <div className="mb-4 p-3 bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-300">
                      All fields are optional — enter available lab values. Missing values are automatically imputed from training data.
                    </p>
                  </div>
                </div>

                {/* Patient Basics */}
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Patient Basics</p>
                <div className="grid grid-cols-3 gap-4 mb-5">
                  {[
                    { key: 'age', label: 'Age (years)', placeholder: '–' },
                    { key: 'bp',  label: 'Blood Pressure (mmHg)', placeholder: '70–180' },
                    { key: 'sg',  label: 'Specific Gravity', placeholder: '1.005–1.030' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
                      <input type="number" step="any" placeholder={placeholder}
                        value={(ckdData as any)[key]}
                        onChange={(e) => setCkdData({ ...ckdData, [key]: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
                    </div>
                  ))}
                </div>

                {/* Blood Work */}
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Blood Work</p>
                <div className="grid grid-cols-3 gap-4 mb-5">
                  {[
                    { key: 'bgr',  label: 'Blood Glucose (mg/dL)',    placeholder: '50–500' },
                    { key: 'bu',   label: 'Blood Urea (mg/dL)',       placeholder: '1–200' },
                    { key: 'sc',   label: 'Serum Creatinine (mg/dL)', placeholder: '0.5–15' },
                    { key: 'sod',  label: 'Sodium (mEq/L)',           placeholder: '110–160' },
                    { key: 'pot',  label: 'Potassium (mEq/L)',        placeholder: '2–10' },
                    { key: 'hemo', label: 'Haemoglobin (g/dL)',       placeholder: '3–20' },
                    { key: 'pcv',  label: 'Packed Cell Vol. (%)',     placeholder: '10–55' },
                    { key: 'wc',   label: 'White Blood Cells',        placeholder: '2000–25000' },
                    { key: 'rc',   label: 'Red Blood Cells (M/cmm)',  placeholder: '1–8' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
                      <input type="number" step="any" placeholder={placeholder}
                        value={(ckdData as any)[key]}
                        onChange={(e) => setCkdData({ ...ckdData, [key]: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
                    </div>
                  ))}
                </div>

                {/* Urine Analysis */}
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Urine Analysis</p>
                <div className="grid grid-cols-3 gap-4 mb-5">
                  {[
                    { key: 'al', label: 'Albumin (0–5)',       options: ['0','1','2','3','4','5'] },
                    { key: 'su', label: 'Sugar (0–5)',         options: ['0','1','2','3','4','5'] },
                    { key: 'rbc', label: 'Red Blood Cells',    options: [['0','Normal'],['1','Abnormal']] as any },
                    { key: 'pc',  label: 'Pus Cell',           options: [['0','Normal'],['1','Abnormal']] as any },
                    { key: 'pcc', label: 'Pus Cell Clumps',    options: [['0','Not Present'],['1','Present']] as any },
                    { key: 'ba',  label: 'Bacteria',           options: [['0','Not Present'],['1','Present']] as any },
                  ].map(({ key, label, options }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
                      <select value={(ckdData as any)[key]} onChange={(e) => setCkdData({ ...ckdData, [key]: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
                        <option value="">–</option>
                        {options.map((o: any) => Array.isArray(o)
                          ? <option key={o[0]} value={o[0]}>{o[1]}</option>
                          : <option key={String(o)} value={String(o)}>{o}</option>
                        )}
                      </select>
                    </div>
                  ))}
                </div>

                {/* Clinical Conditions */}
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Clinical Conditions</p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: 'htn',   label: 'Hypertension' },
                    { key: 'dm',    label: 'Diabetes Mellitus' },
                    { key: 'cad',   label: 'Coronary Artery Disease' },
                    { key: 'appet', label: 'Appetite', opts: [['0','Good'],['1','Poor']] },
                    { key: 'pe',    label: 'Pedal Edema' },
                    { key: 'ane',   label: 'Anaemia' },
                  ].map(({ key, label, opts }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
                      <select value={(ckdData as any)[key]} onChange={(e) => setCkdData({ ...ckdData, [key]: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
                        <option value="">–</option>
                        {(opts || [['0','No'],['1','Yes']] as [string, string][]).map((pair) => (
                          <option key={pair[0]} value={pair[0]}>{pair[1]}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
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
                disabled={loading}
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
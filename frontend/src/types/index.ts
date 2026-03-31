export interface Patient {
  id: number;
  patient_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string;
  age: number;
  gender: 'M' | 'F' | 'O';
  email?: string;
  phone?: string;
  address?: string;
  blood_group?: string;
  medical_history?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  prediction_count: number;
}

export interface PatientList {
  id: number;
  patient_id: string;
  first_name: string;
  last_name: string;
  age: number;
  gender: string;
  created_at: string;
  prediction_count: number;
  last_prediction: string | null;
}

export interface Prediction {
  id: number;
  patient: number;
  patient_details: PatientList;
  disease_type: 'DIABETES' | 'HEART' | 'STROKE' | 'CKD';
  probability: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  input_features: Record<string, any>;
  shap_values: ShapValue[] | null;
  status: 'PENDING' | 'REVIEWED' | 'ARCHIVED';
  notes?: string;
  model_version: string;
  created_at: string;
  updated_at: string;
}

export interface ShapValue {
  feature: string;
  value: number;
  shap_value: number;
}

export interface Statistics {
  total_patients: number;
  active_cases: number;
  predictions_today: number;
  total_predictions: number;
}

export interface DiseaseInfo {
  value: string;
  label: string;
  fields: string[];
}
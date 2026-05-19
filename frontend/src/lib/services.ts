import api, { endpoints } from './api';
import { Patient, PatientList, Prediction, Statistics } from '@/types';

// Patient Services
export const patientService = {
  getAll: async (): Promise<PatientList[]> => {
    try {
      const response = await api.get(endpoints.patients);
      // Handle paginated response
      return response.data.results || response.data;
    } catch (error) {
      console.error('Error fetching patients:', error);
      return [];
    }
  },
  
  getById: async (id: number): Promise<Patient> => {
    const response = await api.get(endpoints.patientDetail(id));
    return response.data;
  },
  
  create: async (data: Partial<Patient>): Promise<Patient> => {
    const response = await api.post(endpoints.patients, data);
    return response.data;
  },
  
  update: async (id: number, data: Partial<Patient>): Promise<Patient> => {
    const response = await api.patch(endpoints.patientDetail(id), data);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(endpoints.patientDetail(id));
  },
  
  getStatistics: async (): Promise<Statistics> => {
    try {
      const response = await api.get(endpoints.patientStatistics);
      return response.data;
    } catch (error) {
      console.error('Error fetching patient statistics:', error);
      return { total_patients: 0, active_cases: 0, predictions_today: 0, total_predictions: 0 };
    }
  },
  
  getPredictions: async (id: number): Promise<Prediction[]> => {
    try {
      const response = await api.get(endpoints.patientPredictions(id));
      return response.data.results || response.data;
    } catch (error) {
      console.error('Error fetching patient predictions:', error);
      return [];
    }
  },
};

// Prediction Services
export const predictionService = {
  getAll: async (): Promise<Prediction[]> => {
    try {
      const response = await api.get(endpoints.predictions);
      // Handle paginated response - DRF returns {results: [...], count: X, next: null, previous: null}
      return response.data.results || response.data;
    } catch (error) {
      console.error('Error fetching predictions:', error);
      return [];
    }
  },
  getMyPredictions: async (): Promise<Prediction[]> => {
    // Returns only predictions belonging to the logged-in patient (filtered server-side)
    try {
      const response = await api.get('/predictions/?mine=true');
      return response.data.results || response.data;
    } catch (error) {
      console.error('Error fetching patient predictions:', error);
      return [];
    }
  },

  
  getById: async (id: number): Promise<Prediction> => {
    const response = await api.get(endpoints.predictionDetail(id));
    return response.data;
  },
  
  create: async (data: {
    patient_id: number;
    disease_type: string;
    input_features: Record<string, any>;
  }): Promise<Prediction> => {
    const response = await api.post(endpoints.createPrediction, data);
    return response.data;
  },
  
  updateStatus: async (id: number, status: string, notes?: string): Promise<Prediction> => {
    const response = await api.patch(endpoints.updatePredictionStatus(id), {
      status,
      notes,
    });
    return response.data;
  },
  
  getStatistics: async (): Promise<Statistics> => {
    try {
      const response = await api.get(endpoints.predictionStatistics);
      return response.data;
    } catch (error) {
      console.error('Error fetching prediction statistics:', error);
      return { total_patients: 0, active_cases: 0, predictions_today: 0, total_predictions: 0 };
    }
  },
};
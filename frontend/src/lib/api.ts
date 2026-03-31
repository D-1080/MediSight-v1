// import axios from 'axios';

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// export const api = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // API endpoints
// export const endpoints = {
//   // Patients
//   patients: '/patients/',
//   patientDetail: (id: number) => `/patients/${id}/`,
//   patientPredictions: (id: number) => `/patients/${id}/predictions/`,
//   patientStatistics: '/patients/statistics/',
  
//   // Predictions
//   predictions: '/predictions/',
//   predictionDetail: (id: number) => `/predictions/${id}/`,
//   createPrediction: '/predictions/create_prediction/',
//   predictionStatistics: '/predictions/statistics/',
//   updatePredictionStatus: (id: number) => `/predictions/${id}/update_status/`,
// };

// export default api;


import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth
  login: '/users/login/',
  logout: '/users/logout/',
  register: '/users/register/',
  me: '/users/me/',
  
  // Patients
  patients: '/patients/',
  patientDetail: (id: number) => `/patients/${id}/`,
  patientPredictions: (id: number) => `/patients/${id}/predictions/`,
  patientStatistics: '/patients/statistics/',
  
  // Predictions
  predictions: '/predictions/',
  predictionDetail: (id: number) => `/predictions/${id}/`,
  createPrediction: '/predictions/create_prediction/',
  predictionStatistics: '/predictions/statistics/',
  updatePredictionStatus: (id: number) => `/predictions/${id}/update_status/`,
};

export default api;
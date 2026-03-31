import { Prediction, PatientList } from '@/types';

export const exportPredictionsToCSV = (predictions: Prediction[]) => {
  const diseaseLabels: Record<string, string> = {
    DIABETES: 'Diabetes Type 2',
    HEART: 'Heart Disease',
    STROKE: 'Stroke',
    CKD: 'Chronic Kidney Disease',
  };

  // CSV Headers
  const headers = [
    'Prediction ID',
    'Patient ID',
    'Patient Name',
    'Age',
    'Gender',
    'Disease Type',
    'Risk Level',
    'Probability (%)',
    'Confidence (%)',
    'Status',
    'Model Version',
    'Prediction Date',
    'Input Features',
  ];

  // CSV Rows
  const rows = predictions.map(pred => [
    pred.id,
    pred.patient_details.patient_id,
    `${pred.patient_details.first_name} ${pred.patient_details.last_name}`,
    pred.patient_details.age,
    pred.patient_details.gender === 'M' ? 'Male' : pred.patient_details.gender === 'F' ? 'Female' : 'Other',
    diseaseLabels[pred.disease_type],
    pred.risk_level,
    pred.probability.toFixed(2),
    pred.confidence.toFixed(2),
    pred.status,
    pred.model_version,
    new Date(pred.created_at).toLocaleString(),
    JSON.stringify(pred.input_features),
  ]);

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `MediSight_Predictions_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportPredictionsDetailedCSV = (predictions: Prediction[]) => {
  const diseaseLabels: Record<string, string> = {
    DIABETES: 'Diabetes Type 2',
    HEART: 'Heart Disease',
    STROKE: 'Stroke',
    CKD: 'Chronic Kidney Disease',
  };

  // Detailed CSV with SHAP values
  const rows: string[][] = [];

  predictions.forEach(pred => {
    // Basic info row
    const basicInfo = [
      pred.id.toString(),
      pred.patient_details.patient_id,
      `${pred.patient_details.first_name} ${pred.patient_details.last_name}`,
      pred.patient_details.age.toString(),
      pred.patient_details.gender === 'M' ? 'Male' : pred.patient_details.gender === 'F' ? 'Female' : 'Other',
      diseaseLabels[pred.disease_type],
      pred.risk_level,
      pred.probability.toFixed(2),
      pred.confidence.toFixed(2),
      pred.status,
      pred.model_version,
      new Date(pred.created_at).toLocaleString(),
    ];

    // Add input features
    Object.entries(pred.input_features).forEach(([key, value]) => {
      basicInfo.push(`${key}: ${value}`);
    });

    // Add top 5 SHAP values
    if (pred.shap_values && pred.shap_values.length > 0) {
      pred.shap_values.slice(0, 5).forEach((shap, idx) => {
        basicInfo.push(`SHAP_${idx + 1}_Feature: ${shap.feature}`);
        basicInfo.push(`SHAP_${idx + 1}_Value: ${shap.shap_value.toFixed(4)}`);
      });
    }

    rows.push(basicInfo);
  });

  // Dynamic headers based on max columns
  const maxColumns = Math.max(...rows.map(row => row.length));
  const headers = [
    'Prediction ID',
    'Patient ID',
    'Patient Name',
    'Age',
    'Gender',
    'Disease Type',
    'Risk Level',
    'Probability (%)',
    'Confidence (%)',
    'Status',
    'Model Version',
    'Prediction Date',
  ];

  // Add dynamic headers for additional columns
  for (let i = headers.length; i < maxColumns; i++) {
    headers.push(`Additional_Data_${i - 11}`);
  }

  // Ensure all rows have same length
  const normalizedRows = rows.map(row => {
    while (row.length < maxColumns) {
      row.push('');
    }
    return row;
  });

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...normalizedRows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `MediSight_Predictions_Detailed_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportPatientsToCSV = (patients: PatientList[]) => {
  // CSV Headers
  const headers = [
    'Patient ID',
    'First Name',
    'Last Name',
    'Age',
    'Gender',
    'Registered Date',
    'Total Predictions',
    'Last Prediction Date',
  ];

  // CSV Rows
  const rows = patients.map(patient => [
    patient.patient_id,
    patient.first_name,
    patient.last_name,
    patient.age,
    patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other',
    new Date(patient.created_at).toLocaleDateString(),
    patient.prediction_count,
    patient.last_prediction ? new Date(patient.last_prediction).toLocaleDateString() : 'N/A',
  ]);

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `MediSight_Patients_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportSHAPValuesToCSV = (prediction: Prediction) => {
  if (!prediction.shap_values || prediction.shap_values.length === 0) {
    alert('No SHAP values available for this prediction');
    return;
  }

  const headers = ['Feature', 'Input Value', 'SHAP Value', 'Contribution'];

  const rows = prediction.shap_values.map(shap => [
    shap.feature,
    shap.value.toString(),
    shap.shap_value.toFixed(6),
    shap.shap_value > 0 ? 'Increases Risk' : 'Decreases Risk',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `SHAP_Values_${prediction.patient_details.patient_id}_${prediction.id}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
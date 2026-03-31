import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Prediction } from '@/types';

export const generatePredictionReport = (prediction: Prediction) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(37, 99, 235); // Blue
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('MediSight', 20, 20);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('AI-Powered Clinical Decision Support', 20, 30);
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Disease Prediction Report', 20, 55);
  
  // Report metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 62);
  doc.text(`Report ID: RPT-${prediction.id}`, 20, 68);
  
  // Patient Information
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Information', 20, 80);
  
  const patientData = [
    ['Patient ID', prediction.patient_details.patient_id],
    ['Name', `${prediction.patient_details.first_name} ${prediction.patient_details.last_name}`],
    ['Age', `${prediction.patient_details.age} years`],
    ['Gender', prediction.patient_details.gender === 'M' ? 'Male' : prediction.patient_details.gender === 'F' ? 'Female' : 'Other'],
  ];
  
  autoTable(doc, {
    startY: 85,
    head: [],
    body: patientData,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 130 }
    }
  });
  
  // Prediction Results
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Prediction Results', 20, finalY);
  
  // Disease info
  const diseaseLabels: Record<string, string> = {
    DIABETES: 'Diabetes Type 2',
    HEART: 'Heart Disease',
    STROKE: 'Stroke',
    CKD: 'Chronic Kidney Disease',
  };
  
  const predictionData = [
    ['Disease Type', diseaseLabels[prediction.disease_type]],
    ['Risk Level', prediction.risk_level],
    ['Probability', `${prediction.probability.toFixed(2)}%`],
    ['Confidence', `${prediction.confidence.toFixed(2)}%`],
    ['Model Version', prediction.model_version],
    ['Prediction Date', new Date(prediction.created_at).toLocaleString()],
  ];
  
  autoTable(doc, {
    startY: finalY + 5,
    head: [],
    body: predictionData,
    theme: 'striped',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 130 }
    },
    didParseCell: (data) => {
      if (data.row.index === 1 && data.column.index === 1) {
        // Color code risk level
        if (prediction.risk_level === 'HIGH') {
          data.cell.styles.textColor = [220, 38, 38]; // Red
          data.cell.styles.fontStyle = 'bold';
        } else if (prediction.risk_level === 'MEDIUM') {
          data.cell.styles.textColor = [202, 138, 4]; // Yellow
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [22, 163, 74]; // Green
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });
  
  // SHAP Explainability
  if (prediction.shap_values && prediction.shap_values.length > 0) {
    const shapY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SHAP Explainability - Feature Contributions', 20, shapY);
    
    const shapData = prediction.shap_values.slice(0, 10).map(shap => [
      shap.feature,
      shap.value.toString(),
      shap.shap_value > 0 ? `+${shap.shap_value.toFixed(4)}` : shap.shap_value.toFixed(4),
      shap.shap_value > 0 ? 'Increases Risk' : 'Decreases Risk'
    ]);
    
    autoTable(doc, {
      startY: shapY + 5,
      head: [['Feature', 'Value', 'SHAP Value', 'Effect']],
      body: shapData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
        3: { cellWidth: 50 }
      },
      didParseCell: (data) => {
        if (data.column.index === 2 && data.section === 'body') {
          const value = parseFloat(data.cell.text[0]);
          if (value > 0) {
            data.cell.styles.textColor = [220, 38, 38]; // Red for positive
          } else {
            data.cell.styles.textColor = [22, 163, 74]; // Green for negative
          }
        }
      }
    });
  }
  
  // Input Features
  const inputY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Clinical Input Features', 20, inputY);
  
  const inputData = Object.entries(prediction.input_features).map(([key, value]) => [
    key,
    typeof value === 'number' ? value.toFixed(2) : value.toString()
  ]);
  
  autoTable(doc, {
    startY: inputY + 5,
    head: [['Feature', 'Value']],
    body: inputData,
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 90 },
      1: { cellWidth: 90 }
    }
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    doc.text(
      'This report is generated by MediSight AI system. For clinical use only.',
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 5,
      { align: 'center' }
    );
  }
  
  // Save
  const fileName = `MediSight_Report_${prediction.patient_details.patient_id}_${prediction.id}.pdf`;
  doc.save(fileName);
};

export const generateBatchReport = (predictions: Prediction[]) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('MediSight', 20, 20);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('AI-Powered Clinical Decision Support', 20, 30);
  
  doc.setTextColor(0, 0, 0);
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Batch Prediction Report', 20, 55);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 62);
  doc.text(`Total Predictions: ${predictions.length}`, 20, 68);
  
  // Summary statistics
  const highRisk = predictions.filter(p => p.risk_level === 'HIGH').length;
  const mediumRisk = predictions.filter(p => p.risk_level === 'MEDIUM').length;
  const lowRisk = predictions.filter(p => p.risk_level === 'LOW').length;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Risk Distribution', 20, 80);
  
  const summaryData = [
    ['High Risk', highRisk.toString(), `${((highRisk/predictions.length)*100).toFixed(1)}%`],
    ['Medium Risk', mediumRisk.toString(), `${((mediumRisk/predictions.length)*100).toFixed(1)}%`],
    ['Low Risk', lowRisk.toString(), `${((lowRisk/predictions.length)*100).toFixed(1)}%`],
  ];
  
  autoTable(doc, {
    startY: 85,
    head: [['Risk Level', 'Count', 'Percentage']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
  });
  
  // Predictions table
  const tableY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('All Predictions', 20, tableY);
  
  const diseaseLabels: Record<string, string> = {
    DIABETES: 'Diabetes',
    HEART: 'Heart Disease',
    STROKE: 'Stroke',
    CKD: 'CKD',
  };
  
  const tableData = predictions.map(p => [
    p.patient_details.patient_id,
    `${p.patient_details.first_name} ${p.patient_details.last_name}`,
    diseaseLabels[p.disease_type],
    p.risk_level,
    `${p.probability.toFixed(1)}%`,
    new Date(p.created_at).toLocaleDateString()
  ]);
  
  autoTable(doc, {
    startY: tableY + 5,
    head: [['Patient ID', 'Name', 'Disease', 'Risk', 'Probability', 'Date']],
    body: tableData,
    theme: 'striped',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 40 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 30 }
    },
    didParseCell: (data) => {
      if (data.column.index === 3 && data.section === 'body') {
        const risk = data.cell.text[0];
        if (risk === 'HIGH') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        } else if (risk === 'MEDIUM') {
          data.cell.styles.textColor = [202, 138, 4];
        } else {
          data.cell.styles.textColor = [22, 163, 74];
        }
      }
    }
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  doc.save(`MediSight_Batch_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
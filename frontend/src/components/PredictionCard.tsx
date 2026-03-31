import { Clock, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { Prediction } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface PredictionCardProps {
  prediction: Prediction;
  onClick?: () => void;
}

const diseaseLabels: Record<string, string> = {
  DIABETES: 'Diabetes Type 2',
  HEART: 'Heart Disease',
  STROKE: 'Stroke',
  CKD: 'Chronic Kidney Disease',
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

export default function PredictionCard({ prediction, onClick }: PredictionCardProps) {
  const timeAgo = formatDistanceToNow(new Date(prediction.created_at), { addSuffix: true });

  return (
    <div 
      className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-white">
              {prediction.patient_details.first_name} {prediction.patient_details.last_name}
            </h3>
            <span className="text-xs text-gray-400">{prediction.patient_details.patient_id}</span>
            <span className={`px-2 py-1 rounded-full text-xs border ${getRiskBadgeColor(prediction.risk_level)}`}>
              {prediction.risk_level} Risk
            </span>
          </div>
          <p className="text-sm text-gray-300 mb-2">{diseaseLabels[prediction.disease_type]}</p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
            <span className="flex items-center gap-1">
              {prediction.status === 'REVIEWED' ? (
                <><CheckCircle className="w-3 h-3 text-green-500" /> Reviewed</>
              ) : (
                <><AlertCircle className="w-3 h-3 text-yellow-500" /> Pending Review</>
              )}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{prediction.probability.toFixed(1)}%</p>
            <p className="text-xs text-gray-400">Probability</p>
          </div>
          <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition flex items-center gap-1">
            <Eye className="w-3 h-3" />
            View Details
          </button>
        </div>
      </div>
      
      {/* Probability Bar */}
      <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getRiskColor(prediction.risk_level)} transition-all`}
          style={{ width: `${prediction.probability}%` }}
        />
      </div>
    </div>
  );
}
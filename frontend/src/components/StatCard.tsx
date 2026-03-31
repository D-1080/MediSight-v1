import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  color: string;
}

export default function StatCard({ icon: Icon, label, value, subtitle, color }: StatCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-gray-400 font-medium">{label}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}
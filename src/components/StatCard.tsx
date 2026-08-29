interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
  onClick?: () => void;
}

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  yellow: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
  cyan: 'bg-cyan-50 text-cyan-600',
  pink: 'bg-pink-50 text-pink-600',
  gray: 'bg-gray-50 text-gray-600',
};

export default function StatCard({ label, value, icon, color, subtitle, onClick }: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-5 transition-all hover:shadow-md ${onClick ? 'cursor-pointer hover:border-gray-300' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold mt-1 text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${colorMap[color] || colorMap.gray}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

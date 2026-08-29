interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'cyan' | 'pink' | 'gray';
  subtitle?: string;
  onClick?: () => void;
}

const iconBgColors: Record<StatCardProps['color'], string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  yellow: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
  cyan: 'bg-cyan-50 text-cyan-600',
  pink: 'bg-pink-50 text-pink-600',
  gray: 'bg-gray-50 text-gray-600',
};

const valueColors: Record<StatCardProps['color'], string> = {
  blue: 'text-blue-600',
  green: 'text-emerald-600',
  yellow: 'text-amber-600',
  red: 'text-red-600',
  purple: 'text-purple-600',
  cyan: 'text-cyan-600',
  pink: 'text-pink-600',
  gray: 'text-gray-600',
};

export default function StatCard({ label, value, icon, color, subtitle, onClick }: StatCardProps) {
  return (
    <div
      className={`card stat-card transition-all hover:shadow-md ${onClick ? 'cursor-pointer hover:border-gray-300' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="label">{label}</p>
          <p className={`value ${valueColors[color]}`}>{value}</p>
          {subtitle && <p className="subtitle">{subtitle}</p>}
        </div>
        <div className={`icon flex-shrink-0 ${iconBgColors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
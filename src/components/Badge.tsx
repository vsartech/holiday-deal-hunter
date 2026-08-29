const colorMap: Record<string, string> = {
  flight: 'badge-blue',
  hotel: 'badge-green',
  package: 'badge-yellow',
  activity: 'badge-purple',
  cruise: 'badge-cyan',
  bus: 'badge-gray',
  train: 'badge-gray',
  cleartrip: 'badge-blue',
  goibibo: 'badge-cyan',
  veena_world: 'badge-purple',
  kesari: 'badge-pink',
  axis_bank: 'badge-red',
  grabon: 'badge-green',
  coupondunia: 'badge-yellow',
  instant_discount: 'badge-green',
  cashback: 'badge-blue',
  coupon_code: 'badge-purple',
  percentage: 'badge-yellow',
};

export default function Badge({ text, color }: { text: string; color?: string }) {
  const className = color ? (colorMap[color] || `badge-${color}`) : 'badge-gray';
  return <span className={`badge ${className}`}>{text.replace(/_/g, ' ')}</span>;
}

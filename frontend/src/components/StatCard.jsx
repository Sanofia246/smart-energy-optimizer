export default function StatCard({ title, value, unit, sub, icon: Icon, color = 'blue', trend, loading }) {
  const colors = {
    blue: 'from-blue-600/20 to-blue-800/10 border-blue-500/20 text-blue-400',
    green: 'from-green-600/20 to-green-800/10 border-green-500/20 text-green-400',
    orange: 'from-orange-600/20 to-orange-800/10 border-orange-500/20 text-orange-400',
    red: 'from-red-600/20 to-red-800/10 border-red-500/20 text-red-400',
    yellow: 'from-yellow-600/20 to-yellow-800/10 border-yellow-500/20 text-yellow-400',
    purple: 'from-purple-600/20 to-purple-800/10 border-purple-500/20 text-purple-400',
  }
  const c = colors[color] || colors.blue
  const iconBg = {
    blue: 'bg-blue-500/20', green: 'bg-green-500/20', orange: 'bg-orange-500/20',
    red: 'bg-red-500/20', yellow: 'bg-yellow-500/20', purple: 'bg-purple-500/20',
  }

  if (loading) {
    return (
      <div className={`rounded-2xl border bg-gradient-to-br p-5 ${c} animate-pulse`}>
        <div className="h-4 bg-white/10 rounded w-3/4 mb-3" />
        <div className="h-8 bg-white/10 rounded w-1/2 mb-2" />
        <div className="h-3 bg-white/10 rounded w-2/3" />
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 ${c}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-400 font-medium">{title}</p>
        {Icon && (
          <div className={`${iconBg[color]} p-2 rounded-lg`}>
            <Icon size={16} className={c.split(' ').find(x => x.startsWith('text-'))} />
          </div>
        )}
      </div>
      <div className="flex items-end gap-1.5 mb-1">
        <span className="text-3xl font-bold text-white">{value ?? '—'}</span>
        {unit && <span className="text-sm text-gray-400 pb-1">{unit}</span>}
      </div>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
      {trend !== undefined && (
        <div className={`mt-2 text-xs font-medium ${trend >= 0 ? 'text-red-400' : 'text-green-400'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  )
}

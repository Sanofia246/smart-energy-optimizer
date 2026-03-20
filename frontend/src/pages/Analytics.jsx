import { useEffect, useState } from 'react'
import { RefreshCw, BarChart3 } from 'lucide-react'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import { dataAPI, predictAPI } from '../utils/api'
import toast from 'react-hot-toast'

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const Tooltip_ = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(3) : p.value}</p>
      ))}
    </div>
  )
}

export default function Analytics() {
  const [hourlyAvg, setHourlyAvg] = useState([])
  const [monthlySummary, setMonthlySummary] = useState([])
  const [accuracy, setAccuracy] = useState(null)
  const [dailySummary, setDailySummary] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [h, m, a, d] = await Promise.allSettled([
        dataAPI.getHourlyAverage(),
        dataAPI.getMonthlySummary(),
        predictAPI.accuracy(),
        dataAPI.getDailySummary({ days: 30 }),
      ])
      if (h.status === 'fulfilled') setHourlyAvg(h.value.data.data || [])
      if (m.status === 'fulfilled') setMonthlySummary(m.value.data.data || [])
      if (a.status === 'fulfilled') setAccuracy(a.value.data)
      if (d.status === 'fulfilled') setDailySummary((d.value.data.data || []).reverse())
    } catch { toast.error('Failed to load analytics') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const hourlyChartData = hourlyAvg.map(h => ({
    hour: `${h.hour}:00`,
    avg_kwh: parseFloat(parseFloat(h.avg_kwh).toFixed(3)),
    avg_power: parseFloat(parseFloat(h.avg_power || 0).toFixed(3)),
  }))

  const monthlyChartData = [...monthlySummary].reverse().map(m => ({
    month: MONTHS_SHORT[m.month - 1],
    kwh: parseFloat(parseFloat(m.total_kwh || 0).toFixed(1)),
    cost: parseFloat(parseFloat(m.total_cost || 0).toFixed(0)),
  }))

  const dailyChartData = dailySummary.map(d => ({
    date: d.date?.slice(5),
    kwh: parseFloat(parseFloat(d.total_kwh || 0).toFixed(2)),
    peak: parseFloat(parseFloat(d.peak_power || 0).toFixed(3)),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-gray-400 mt-0.5">Deep analysis of your energy consumption patterns</p>
        </div>
        <button onClick={fetchAll} className="btn-outline text-sm">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Model accuracy */}
      {accuracy && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Hybrid Model', value: `${accuracy.accuracy?.toFixed(1)}%`, sub: 'Accuracy', color: 'text-green-400' },
            { label: 'Prophet Alone', value: `${accuracy.benchmark?.prophet_standalone}%`, sub: 'Accuracy', color: 'text-blue-400' },
            { label: 'XGBoost Alone', value: `${accuracy.benchmark?.xgboost_standalone}%`, sub: 'Accuracy', color: 'text-purple-400' },
            { label: 'MAPE', value: `${accuracy.mape?.toFixed(2)}%`, sub: 'Error rate', color: 'text-yellow-400' },
            { label: 'R² Score', value: accuracy.r_squared?.toFixed(3), sub: 'Fit quality', color: 'text-cyan-400' },
          ].map((s, i) => (
            <div key={i} className="card p-4 text-center">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-600 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Model comparison bar */}
      {accuracy && (
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-white text-sm">Model Performance Comparison</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={[
                { model: 'Prophet', accuracy: accuracy.benchmark?.prophet_standalone, fill: '#3b82f6' },
                { model: 'XGBoost', accuracy: accuracy.benchmark?.xgboost_standalone, fill: '#8b5cf6' },
                { model: 'Hybrid (Ours)', accuracy: accuracy.accuracy?.toFixed(1), fill: '#22c55e' },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="model" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis domain={[70, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} unit="%" />
                <Tooltip formatter={v => [`${v}%`, 'Accuracy']} />
                <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                  {[
                    { fill: '#3b82f6' }, { fill: '#8b5cf6' }, { fill: '#22c55e' }
                  ].map((c, i) => (
                    <rect key={i} fill={c.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Hourly average profile */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-white text-sm">Average Hourly Consumption Profile</h2>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="h-[220px] flex items-center justify-center"><RefreshCw size={20} className="animate-spin text-gray-600" /></div>
          ) : hourlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={hourlyChartData}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="hour" tick={{ fill: '#6b7280', fontSize: 10 }} interval={2} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} unit=" kWh" />
                <Tooltip content={<Tooltip_ />} />
                <Area type="monotone" dataKey="avg_kwh" stroke="#3b82f6" strokeWidth={2}
                  fill="url(#areaGrad)" name="Avg kWh" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-600 text-sm">No hourly data available</div>
          )}
        </div>
      </div>

      {/* Daily + Monthly charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 30-day daily */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-white text-sm">Daily Usage — Last 30 Days</h2>
          </div>
          <div className="card-body">
            {dailyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 9 }} interval={4} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} unit=" kWh" />
                  <Tooltip content={<Tooltip_ />} />
                  <Line type="monotone" dataKey="kwh" stroke="#22c55e" strokeWidth={2} dot={false} name="Total kWh" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-600 text-sm">No daily data available</div>
            )}
          </div>
        </div>

        {/* Monthly history */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-white text-sm">Monthly Cost & Consumption History</h2>
          </div>
          <div className="card-body">
            {monthlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} yAxisId="left" />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} yAxisId="right" orientation="right" />
                  <Tooltip content={<Tooltip_ />} />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
                  <Bar yAxisId="left" dataKey="kwh" fill="#3b82f6" radius={[3,3,0,0]} opacity={0.8} name="kWh" />
                  <Bar yAxisId="right" dataKey="cost" fill="#f59e0b" radius={[3,3,0,0]} opacity={0.8} name="₹ Cost" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-600 text-sm">No monthly history available</div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly summary table */}
      {monthlySummary.length > 0 && (
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <BarChart3 size={15} className="text-gray-400" />
            <h2 className="font-semibold text-white text-sm">Monthly Summary Table</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Month', 'Year', 'Total kWh', 'Avg Hourly', 'Est. Cost', 'Savings Potential', 'Readings'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlySummary.map((row, i) => (
                  <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-2.5 text-gray-300 font-medium">{MONTHS_SHORT[row.month - 1]}</td>
                    <td className="px-4 py-2.5 text-gray-400">{row.year}</td>
                    <td className="px-4 py-2.5 text-white">{parseFloat(row.total_kwh || 0).toFixed(1)}</td>
                    <td className="px-4 py-2.5 text-gray-400">{parseFloat(row.avg_hourly_kwh || 0).toFixed(3)}</td>
                    <td className="px-4 py-2.5 text-yellow-400">₹{parseFloat(row.total_cost || 0).toFixed(0)}</td>
                    <td className="px-4 py-2.5 text-green-400">₹{parseFloat(row.savings_potential || 0).toFixed(0)}</td>
                    <td className="px-4 py-2.5 text-gray-500">{row.readings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

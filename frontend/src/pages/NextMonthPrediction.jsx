import { useEffect, useState } from 'react'
import { CalendarDays, TrendingUp, Leaf, DollarSign, RefreshCw, Info } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, LineChart, Line, Legend, Cell
} from 'recharts'
import { predictAPI } from '../utils/api'
import toast from 'react-hot-toast'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-white">Predicted: <span className="text-blue-400">{d?.predicted_kwh?.toFixed(2)} kWh</span></p>
      <p className="text-white">Est. Cost: <span className="text-yellow-400">₹{d?.predicted_cost?.toFixed(0)}</span></p>
      <p className="text-gray-500">{DOW[d?.day_of_week]}</p>
    </div>
  )
}

export default function NextMonthPrediction() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await predictAPI.nextMonth()
      setData(res.data)
    } catch (e) {
      toast.error('Failed to load monthly prediction. Please ensure data is loaded first.')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const weeklyData = data?.daily_predictions ? (() => {
    const weeks = {}
    data.daily_predictions.forEach(d => {
      const wk = `W${Math.ceil(d.day / 7)}`
      if (!weeks[wk]) weeks[wk] = { week: wk, kwh: 0, cost: 0, days: 0 }
      weeks[wk].kwh += d.predicted_kwh
      weeks[wk].cost += d.predicted_cost
      weeks[wk].days++
    })
    return Object.values(weeks).map(w => ({ ...w, kwh: parseFloat(w.kwh.toFixed(2)), cost: parseFloat(w.cost.toFixed(0)) }))
  })() : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Monthly Forecast</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {data ? `Predicting ${data.month_name} ${data.year}` : 'Next month energy & cost prediction'}
          </p>
        </div>
        <button onClick={fetch} disabled={loading} className="btn-primary text-sm">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Predicting...' : 'Refresh Forecast'}
        </button>
      </div>

      {loading ? (
        <div className="card p-12 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw size={28} className="animate-spin text-primary-500 mx-auto mb-3" />
            <p className="text-gray-400">Running Prophet seasonal model + XGBoost...</p>
          </div>
        </div>
      ) : data ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Predicted', value: `${data.total_predicted_kwh} kWh`, color: 'blue', icon: '⚡' },
              { label: 'Estimated Bill', value: `₹${data.total_predicted_cost?.toFixed(0)}`, color: 'yellow', icon: '💰' },
              { label: 'Avg Daily Usage', value: `${data.avg_daily_kwh} kWh`, color: 'purple', icon: '📊' },
              { label: 'Savings Potential', value: `₹${data.savings_potential?.toFixed(0)}`, color: 'green', icon: '🌿' },
            ].map((s, i) => (
              <div key={i} className={`rounded-2xl border p-5 bg-gradient-to-br ${
                s.color === 'blue' ? 'from-blue-600/20 to-blue-800/10 border-blue-500/20' :
                s.color === 'yellow' ? 'from-yellow-600/20 to-yellow-800/10 border-yellow-500/20' :
                s.color === 'purple' ? 'from-purple-600/20 to-purple-800/10 border-purple-500/20' :
                'from-green-600/20 to-green-800/10 border-green-500/20'
              }`}>
                <p className="text-2xl mb-2">{s.icon}</p>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Seasonal factor info */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
            <Info size={16} className="text-blue-400 mt-0.5 shrink-0" />
            <div className="text-xs">
              <p className="text-blue-300 font-medium">Seasonal Factor for {data.month_name}: ×{data.seasonal_factor}</p>
              <p className="text-gray-400 mt-0.5">
                {data.seasonal_factor > 1.2 ? '🌡️ Hot month expected — high AC usage will drive consumption up.' :
                 data.seasonal_factor < 1.0 ? '🌧️ Cooler month — lower energy consumption expected.' :
                 '☀️ Moderate season — typical consumption expected for Coimbatore.'}
                {' '}Model accuracy: <strong className="text-white">{(data.confidence * 100).toFixed(1)}%</strong>
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily chart */}
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold text-white text-sm">Daily Forecast — {data.month_name} {data.year}</h2>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.daily_predictions}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 10 }}
                      tickFormatter={v => `${v}`} interval={4} label={{ value: 'Day', position: 'insideBottom', offset: -2, fill: '#4b5563', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} unit=" kWh" width={55} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="predicted_kwh" radius={[3,3,0,0]} name="kWh">
                      {data.daily_predictions.map((d, i) => (
                        <Cell key={i} fill={[0, 6].includes(d.day_of_week) ? '#8b5cf6' : '#3b82f6'} opacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-600 mt-2">Purple = weekend days (higher usage)</p>
              </div>
            </div>

            {/* Weekly summary */}
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold text-white text-sm">Weekly Cost Breakdown</h2>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <Tooltip formatter={(v, n) => [n === 'cost' ? `₹${v}` : `${v} kWh`, n === 'cost' ? 'Est. Cost' : 'Total kWh']} />
                    <Legend formatter={v => v === 'cost' ? 'Est. Cost (₹)' : 'Total kWh'} wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
                    <Bar dataKey="kwh" fill="#3b82f6" radius={[4,4,0,0]} opacity={0.8} />
                    <Bar dataKey="cost" fill="#f59e0b" radius={[4,4,0,0]} opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* TNEB Tariff Slab Breakdown */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-white text-sm">TNEB Tariff Slab Analysis — {data.month_name}</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { slab: '0–100 units', rate: 'FREE', units: Math.min(data.total_predicted_kwh, 100), color: 'eco' },
                  { slab: '101–200 units', rate: '₹1.50/unit', units: Math.max(0, Math.min(data.total_predicted_kwh - 100, 100)), color: 'yellow' },
                  { slab: '201–500 units', rate: '₹3.00/unit', units: Math.max(0, Math.min(data.total_predicted_kwh - 200, 300)), color: 'orange' },
                  { slab: '500+ units', rate: '₹5.75/unit', units: Math.max(0, data.total_predicted_kwh - 500), color: 'red' },
                ].map((s, i) => (
                  <div key={i} className={`rounded-xl border p-4 ${
                    s.color === 'eco' ? 'border-green-500/20 bg-green-500/5' :
                    s.color === 'yellow' ? 'border-yellow-500/20 bg-yellow-500/5' :
                    s.color === 'orange' ? 'border-orange-500/20 bg-orange-500/5' :
                    'border-red-500/20 bg-red-500/5'
                  }`}>
                    <p className="text-xs text-gray-400">{s.slab}</p>
                    <p className={`text-lg font-bold mt-1 ${
                      s.color === 'eco' ? 'text-green-400' :
                      s.color === 'yellow' ? 'text-yellow-400' :
                      s.color === 'orange' ? 'text-orange-400' : 'text-red-400'
                    }`}>{s.units.toFixed(1)} kWh</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.rate}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-gray-800 rounded-xl">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div><span className="text-gray-500 text-xs">Total Predicted kWh</span><p className="text-white font-bold">{data.total_predicted_kwh}</p></div>
                  <div><span className="text-gray-500 text-xs">Estimated Bill</span><p className="text-yellow-400 font-bold">₹{data.total_predicted_cost?.toFixed(0)}</p></div>
                  <div><span className="text-gray-500 text-xs">Max Savings (22%)</span><p className="text-eco-400 font-bold">₹{data.savings_potential?.toFixed(0)}</p></div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily predictions table */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-white text-sm">Full Daily Forecast Table</h2>
            </div>
            <div className="overflow-x-auto max-h-64 scrollbar-thin">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-900">
                  <tr className="border-b border-gray-800">
                    {['Date', 'Day', 'Predicted kWh', 'Est. Cost', 'Notes'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-gray-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.daily_predictions.map((row, i) => (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="px-4 py-2.5 text-gray-300">{row.date}</td>
                      <td className="px-4 py-2.5 text-gray-400">{DOW[row.day_of_week]}</td>
                      <td className="px-4 py-2.5 text-white font-medium">{row.predicted_kwh}</td>
                      <td className="px-4 py-2.5 text-yellow-400">₹{row.predicted_cost}</td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {[0, 6].includes(row.day_of_week) ? '📅 Weekend — higher usage' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card p-12 text-center text-gray-500">No prediction data available. Please load data first.</div>
      )}
    </div>
  )
}

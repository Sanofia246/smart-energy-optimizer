import { useState } from 'react'
import { Zap, Calculator, TrendingUp, Leaf, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { predictAPI } from '../utils/api'
import toast from 'react-hot-toast'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const COLORS = ['#3b82f6','#06b6d4','#0ea5e9','#8b5cf6','#f59e0b','#6b7280']

export default function LiveReading() {
  const [form, setForm] = useState({
    current_reading_kwh: '',
    days_elapsed: new Date().getDate(),
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.current_reading_kwh) return toast.error('Please enter current meter reading')
    setLoading(true)
    try {
      const res = await predictAPI.fromReading(form)
      setResult(res.data)
      toast.success('Prediction generated successfully!')
    } catch (e) {
      toast.error('Failed to generate prediction')
    } finally { setLoading(false) }
  }

  const alertColor = result ? (
    result.projected_monthly_kwh > 500 ? 'red' :
    result.projected_monthly_kwh > 200 ? 'orange' :
    result.projected_monthly_kwh > 100 ? 'yellow' : 'green'
  ) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Live Meter Reading</h1>
        <p className="text-sm text-gray-400 mt-0.5">Enter your current EB meter reading to get real-time monthly projection & cost forecast</p>
      </div>

      {/* Input form */}
      <div className="card max-w-2xl">
        <div className="card-header">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Calculator size={16} className="text-primary-400" /> Enter Meter Details
          </h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Current Reading (kWh / Units) *</label>
                <input type="number" step="0.01" min="0" required
                  placeholder="e.g. 245.5"
                  value={form.current_reading_kwh}
                  onChange={e => setForm(f => ({ ...f, current_reading_kwh: e.target.value }))}
                  className="input-field text-lg font-semibold" />
                <p className="text-xs text-gray-600 mt-1">Units consumed since billing cycle start</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Days Elapsed This Cycle</label>
                <input type="number" min="1" max="31"
                  value={form.days_elapsed}
                  onChange={e => setForm(f => ({ ...f, days_elapsed: parseInt(e.target.value) }))}
                  className="input-field" />
                <p className="text-xs text-gray-600 mt-1">Days since billing cycle started</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Current Month</label>
                <select value={form.month} onChange={e => setForm(f => ({ ...f, month: parseInt(e.target.value) }))} className="input-field">
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Year</label>
                <input type="number" value={form.year}
                  onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) }))}
                  className="input-field" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
              <Zap size={18} />
              {loading ? 'Calculating...' : 'Generate Prediction'}
            </button>
          </form>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Alert banner */}
          <div className={`rounded-2xl border p-5 flex items-start gap-4 ${
            alertColor === 'red' ? 'border-red-500/30 bg-red-500/10' :
            alertColor === 'orange' ? 'border-orange-500/30 bg-orange-500/10' :
            alertColor === 'yellow' ? 'border-yellow-500/30 bg-yellow-500/10' :
            'border-green-500/30 bg-green-500/10'
          }`}>
            {alertColor === 'green' ? <CheckCircle size={20} className="text-green-400 mt-0.5 shrink-0" /> :
             <AlertTriangle size={20} className={`mt-0.5 shrink-0 ${alertColor === 'red' ? 'text-red-400' : alertColor === 'orange' ? 'text-orange-400' : 'text-yellow-400'}`} />}
            <div>
              <p className={`font-semibold text-sm ${alertColor === 'green' ? 'text-green-300' : alertColor === 'red' ? 'text-red-300' : alertColor === 'orange' ? 'text-orange-300' : 'text-yellow-300'}`}>
                {alertColor === 'green' ? '✅ Excellent! Usage is within free slab.' :
                 alertColor === 'yellow' ? '⚠️ Moderate usage — optimise to stay under 200 units.' :
                 alertColor === 'orange' ? '🔶 High usage projected. Consider load shifting.' :
                 '🚨 Very high usage! Take action to reduce consumption.'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Projected monthly: <strong className="text-white">{result.projected_monthly_kwh} kWh</strong> ·
                Daily rate: <strong className="text-white">{result.daily_rate} kWh/day</strong> ·
                Remaining: <strong className="text-white">{result.remaining_days} days</strong>
              </p>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Projected Monthly', value: `${result.projected_monthly_kwh} kWh`, icon: Zap, bg: 'from-blue-600/20 to-blue-800/10 border-blue-500/20' },
              { label: 'Projected Bill', value: `₹${result.projected_monthly_cost?.toFixed(0)}`, icon: TrendingUp, bg: 'from-yellow-600/20 to-yellow-800/10 border-yellow-500/20' },
              { label: 'Cost So Far', value: `₹${result.current_cost_so_far?.toFixed(0)}`, icon: Info, bg: 'from-purple-600/20 to-purple-800/10 border-purple-500/20' },
              { label: 'Possible Savings', value: `₹${result.savings_potential?.toFixed(0)}`, icon: Leaf, bg: 'from-green-600/20 to-green-800/10 border-green-500/20' },
            ].map((s, i) => (
              <div key={i} className={`rounded-2xl border bg-gradient-to-br p-5 ${s.bg}`}>
                <p className="text-xs text-gray-400 mb-2">{s.label}</p>
                <p className="text-2xl font-bold text-white">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Appliance breakdown */}
            <div className="card">
              <div className="card-header"><h2 className="font-semibold text-white text-sm">Appliance Breakdown (Projected)</h2></div>
              <div className="card-body">
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={160}>
                    <PieChart>
                      <Pie data={result.appliance_breakdown} dataKey="kwh" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                        {result.appliance_breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v.toFixed(1)} kWh`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {result.appliance_breakdown.map((a, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-gray-400">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                          {a.icon} {a.name}
                        </span>
                        <span className="text-white font-medium">{a.kwh.toFixed(1)} kWh</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Appliance bar chart */}
            <div className="card">
              <div className="card-header"><h2 className="font-semibold text-white text-sm">Usage by Appliance (kWh)</h2></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={result.appliance_breakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} unit=" kWh" />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} width={100} />
                    <Tooltip formatter={(v) => [`${v.toFixed(1)} kWh`]} />
                    <Bar dataKey="kwh" radius={[0, 4, 4, 0]}>
                      {result.appliance_breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="card">
            <div className="card-header"><h2 className="font-semibold text-white text-sm">🤖 AI Recommendations</h2></div>
            <div className="card-body space-y-3">
              {result.eco_recommendations?.map((rec, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${
                  rec.type === 'warning' ? 'bg-orange-500/10 border-orange-500/20' :
                  rec.type === 'success' ? 'bg-green-500/10 border-green-500/20' :
                  'bg-blue-500/10 border-blue-500/20'
                }`}>
                  <span className="text-lg shrink-0">{rec.type === 'warning' ? '⚠️' : rec.type === 'success' ? '✅' : 'ℹ️'}</span>
                  <p className={`text-sm ${rec.type === 'warning' ? 'text-orange-300' : rec.type === 'success' ? 'text-green-300' : 'text-blue-300'}`}>{rec.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* TNEB Tariff visual */}
          <div className="card">
            <div className="card-header"><h2 className="font-semibold text-white text-sm">TNEB Tariff Slab Position</h2></div>
            <div className="card-body">
              <div className="relative">
                <div className="flex rounded-xl overflow-hidden h-8 mb-3">
                  <div className="bg-green-500 flex items-center justify-center text-xs text-white font-medium" style={{ width: '20%' }}>Free</div>
                  <div className="bg-yellow-500 flex items-center justify-center text-xs text-white font-medium" style={{ width: '20%' }}>₹1.50</div>
                  <div className="bg-orange-500 flex items-center justify-center text-xs text-white font-medium" style={{ width: '30%' }}>₹3.00</div>
                  <div className="bg-red-500 flex items-center justify-center text-xs text-white font-medium" style={{ width: '30%' }}>₹5.75</div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>0</span><span>100</span><span>200</span><span>500</span><span>∞</span>
                </div>
                {/* Current position indicator */}
                <div className="text-xs text-gray-400 mt-3">
                  Current usage: <span className="text-white font-bold">{result.current_reading_kwh} units</span> →
                  <span className={`ml-1 font-bold ${
                    result.current_reading_kwh <= 100 ? 'text-green-400' :
                    result.current_reading_kwh <= 200 ? 'text-yellow-400' :
                    result.current_reading_kwh <= 500 ? 'text-orange-400' : 'text-red-400'
                  }`}>
                    {result.current_reading_kwh <= 100 ? 'FREE slab ✅' :
                     result.current_reading_kwh <= 200 ? '₹1.50/unit slab' :
                     result.current_reading_kwh <= 500 ? '₹3.00/unit slab' : '₹5.75/unit slab ⚠️'}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Projected end-of-month: <span className="text-white font-bold">{result.projected_monthly_kwh} units</span> →
                  <span className={`ml-1 font-bold ${
                    result.projected_monthly_kwh <= 100 ? 'text-green-400' :
                    result.projected_monthly_kwh <= 200 ? 'text-yellow-400' :
                    result.projected_monthly_kwh <= 500 ? 'text-orange-400' : 'text-red-400'
                  }`}>
                    {result.projected_monthly_kwh <= 100 ? 'FREE ✅' :
                     result.projected_monthly_kwh <= 200 ? '₹1.50 slab' :
                     result.projected_monthly_kwh <= 500 ? '₹3.00 slab' : '₹5.75 slab 🚨'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

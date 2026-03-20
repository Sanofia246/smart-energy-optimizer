import { useEffect, useState } from 'react'
import { Zap, TrendingUp, Leaf, DollarSign, Thermometer, AlertTriangle, RefreshCw } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts'
import { dashboardAPI, dataAPI, weatherAPI, predictAPI } from '../utils/api'
import StatCard from '../components/StatCard'
import toast from 'react-hot-toast'

const COLORS = ['#3b82f6', '#06b6d4', '#0ea5e9', '#8b5cf6', '#f59e0b', '#6b7280']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value} {p.name.includes('cost') || p.name.includes('Cost') ? '₹' : 'kWh'}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [overview, setOverview] = useState(null)
  const [appliances, setAppliances] = useState([])
  const [weather, setWeather] = useState(null)
  const [peakEco, setPeakEco] = useState(null)
  const [monthlySummary, setMonthlySummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [ov, ap, wx, pe, ms] = await Promise.allSettled([
        dashboardAPI.overview(),
        dashboardAPI.applianceBreakdown(),
        weatherAPI.coimbatore(),
        predictAPI.peakEcoHours(),
        dataAPI.getMonthlySummary(),
      ])
      if (ov.status === 'fulfilled') setOverview(ov.value.data)
      if (ap.status === 'fulfilled') setAppliances(ap.value.data.data || [])
      if (wx.status === 'fulfilled') setWeather(wx.value.data)
      if (pe.status === 'fulfilled') setPeakEco(pe.value.data)
      if (ms.status === 'fulfilled') setMonthlySummary(ms.value.data.data || [])
    } catch (e) {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const seedData = async () => {
    setSeeding(true)
    try {
      await dataAPI.seed(90)
      toast.success('Sample data loaded!')
      fetchAll()
    } catch (e) {
      toast.error('Failed to seed data')
    } finally {
      setSeeding(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const noData = !loading && (!overview?.current_month?.readings || overview.current_month.readings === 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Energy Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Smart Resource Optimization · Coimbatore, Tamil Nadu</p>
        </div>
        <div className="flex gap-2">
          {noData && (
            <button onClick={seedData} disabled={seeding} className="btn-eco text-sm">
              {seeding ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
              {seeding ? 'Loading...' : 'Load Sample Data'}
            </button>
          )}
          <button onClick={fetchAll} className="btn-outline text-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* No data banner */}
      {noData && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-yellow-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-yellow-300 font-medium text-sm">No data found</p>
            <p className="text-yellow-400/70 text-xs mt-0.5">Upload your TNEB CSV dataset or click "Load Sample Data" to get started with demo data from the Kaggle dataset.</p>
          </div>
        </div>
      )}

      {/* Weather card */}
      {weather && (
        <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/20 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-3">
            <Thermometer size={22} className="text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-white">{weather.temp}°C</p>
              <p className="text-xs text-gray-400 capitalize">{weather.description} · Feels like {weather.feels_like}°C</p>
            </div>
          </div>
          <div className="flex gap-6 text-sm flex-wrap">
            <div><span className="text-gray-500">Humidity</span><p className="text-white font-medium">{weather.humidity}%</p></div>
            <div><span className="text-gray-500">Wind</span><p className="text-white font-medium">{weather.wind_speed?.toFixed(1)} m/s</p></div>
            <div>
              <span className="text-gray-500">Energy Impact</span>
              <p className={`font-medium text-xs mt-0.5 ${
                weather.energy_impact?.level === 'very_high' ? 'text-red-400' :
                weather.energy_impact?.level === 'high' ? 'text-orange-400' :
                weather.energy_impact?.level === 'moderate' ? 'text-yellow-400' : 'text-green-400'
              }`}>{weather.energy_impact?.message}</p>
            </div>
          </div>
          {weather.note && <p className="text-xs text-gray-600 ml-auto">{weather.note}</p>}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="This Month (kWh)" loading={loading}
          value={overview?.current_month?.kwh?.toFixed(1)}
          unit="kWh" icon={Zap} color="blue"
          sub={`${overview?.current_month?.readings || 0} hourly readings`}
        />
        <StatCard
          title="Estimated Cost" loading={loading}
          value={`₹${overview?.current_month?.cost?.toFixed(0) || '0'}`}
          icon={DollarSign} color="yellow"
          sub="TNEB slab tariff"
        />
        <StatCard
          title="Savings Potential" loading={loading}
          value={`₹${overview?.savings_potential?.toFixed(0) || '0'}`}
          icon={Leaf} color="green"
          sub="22% via load shifting"
        />
        <StatCard
          title="Today's Usage" loading={loading}
          value={overview?.today?.kwh?.toFixed(1)}
          unit="kWh" icon={TrendingUp} color="purple"
          sub={`Peak: ${overview?.today?.peak_power?.toFixed(2) || 0} kW`}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly trend */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-white text-sm">7-Day Consumption Trend</h2>
            <span className="badge-normal">kWh / day</span>
          </div>
          <div className="card-body">
            {overview?.week_trend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={overview.week_trend}>
                  <defs>
                    <linearGradient id="kwhGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }}
                    tickFormatter={v => v?.slice(5)} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="kwh" stroke="#3b82f6" strokeWidth={2}
                    fill="url(#kwhGrad)" name="Consumption" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-600 text-sm">No weekly data available</div>
            )}
          </div>
        </div>

        {/* Appliance breakdown */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-white text-sm">Appliance Breakdown</h2>
            <span className="badge-normal">This Month</span>
          </div>
          <div className="card-body">
            {appliances.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={appliances} dataKey="kwh" cx="50%" cy="50%" innerRadius={45} outerRadius={75}>
                      {appliances.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v.toFixed(1)} kWh`, '']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {appliances.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-400 flex-1">{a.icon} {a.name}</span>
                      <span className="text-white font-medium">{a.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-gray-600 text-sm">No appliance data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly summary & Peak/Eco hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly bar chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-white text-sm">Monthly Consumption History</h2>
          </div>
          <div className="card-body">
            {monthlySummary.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[...monthlySummary].reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }}
                    tickFormatter={v => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][v-1]} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total_kwh" fill="#3b82f6" radius={[4,4,0,0]} name="Total kWh" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-600 text-sm">No monthly data</div>
            )}
          </div>
        </div>

        {/* Peak vs Eco hours heatmap */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-white text-sm">Hourly Load Profile</h2>
          </div>
          <div className="card-body">
            {peakEco?.hourly_data?.length > 0 ? (
              <>
                <div className="grid grid-cols-12 gap-1 mb-3">
                  {peakEco.hourly_data.map(h => (
                    <div key={h.hour}
                      title={`${h.hour}:00 — ${h.avg_kwh} kWh`}
                      className={`h-8 rounded flex items-end justify-center pb-1 text-[9px] font-medium cursor-default transition-all ${
                        h.is_peak ? 'bg-orange-500/70 text-orange-200' :
                        h.is_eco ? 'bg-green-500/70 text-green-200' :
                        'bg-blue-500/30 text-blue-400'
                      }`}>
                      {h.hour}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-orange-500/70" /><span className="text-gray-400">Peak Hours (avoid)</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-500/70" /><span className="text-gray-400">Eco Hours (prefer)</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-500/30" /><span className="text-gray-400">Normal</span></div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2.5">
                    <p className="text-xs text-orange-400 font-medium">⚡ Peak Hours</p>
                    <p className="text-xs text-gray-400 mt-0.5">{peakEco.peak_hours?.join(', ')}:00</p>
                    <p className="text-[10px] text-gray-600 mt-1">₹5.75/unit — avoid heavy appliances</p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2.5">
                    <p className="text-xs text-green-400 font-medium">🌿 Eco Hours</p>
                    <p className="text-xs text-gray-400 mt-0.5">{peakEco.eco_hours?.join(', ')}:00</p>
                    <p className="text-[10px] text-gray-600 mt-1">₹1.50/unit — run laundry, pump etc.</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-[150px] flex items-center justify-center text-gray-600 text-sm">No hourly data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

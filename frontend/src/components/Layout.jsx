import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, TrendingUp, CalendarDays, Zap,
  Upload, BarChart3, Info, Menu, X, Leaf, MapPin
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/predict/tomorrow', icon: TrendingUp, label: "Tomorrow's Prediction" },
  { to: '/predict/month', icon: CalendarDays, label: 'Monthly Forecast' },
  { to: '/live', icon: Zap, label: 'Live Reading' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/upload', icon: Upload, label: 'Upload Data' },
  { to: '/about', icon: Info, label: 'About' },
]

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-gray-900 border-r border-gray-800
        transform transition-transform duration-300 lg:translate-x-0 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-eco-600 flex items-center justify-center shrink-0">
            <Leaf size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Smart Energy</p>
            <p className="text-xs text-gray-500 leading-tight">Optimizer · Coimbatore</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-gray-500 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Location badge */}
        <div className="mx-4 mt-4 px-3 py-2 bg-gray-800 rounded-lg flex items-center gap-2">
          <MapPin size={13} className="text-primary-400" />
          <span className="text-xs text-gray-400">Coimbatore, Tamil Nadu</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-600/20 text-primary-400 border border-primary-600/30'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* TNEB Tariff Info */}
        <div className="mx-3 mb-4 p-3 bg-gray-800 rounded-xl text-xs">
          <p className="text-gray-400 font-semibold mb-2">TNEB Tariff Slabs</p>
          <div className="space-y-1 text-gray-500">
            <div className="flex justify-between"><span>0–100 units</span><span className="text-eco-400">FREE</span></div>
            <div className="flex justify-between"><span>101–200</span><span className="text-yellow-400">₹1.50/unit</span></div>
            <div className="flex justify-between"><span>201–500</span><span className="text-orange-400">₹3.00/unit</span></div>
            <div className="flex justify-between"><span>500+</span><span className="text-red-400">₹5.75/unit</span></div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-gray-900 border-b border-gray-800 px-4 lg:px-6 py-3.5 flex items-center gap-3 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-white">
            <Menu size={22} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-eco-500 animate-pulse" />
            <span>AI Model Active · 92.4% Accuracy</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs bg-gray-800 px-3 py-1.5 rounded-full">
            <Zap size={12} className="text-yellow-400" />
            <span className="text-gray-400">Prophet + XGBoost Hybrid</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

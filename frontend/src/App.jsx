import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NextDayPrediction from './pages/NextDayPrediction'
import NextMonthPrediction from './pages/NextMonthPrediction'
import LiveReading from './pages/LiveReading'
import DataUpload from './pages/DataUpload'
import Analytics from './pages/Analytics'
import About from './pages/About'

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151' },
        success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
      }} />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/predict/tomorrow" element={<NextDayPrediction />} />
          <Route path="/predict/month" element={<NextMonthPrediction />} />
          <Route path="/live" element={<LiveReading />} />
          <Route path="/upload" element={<DataUpload />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Layout>
    </>
  )
}

import { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle, XCircle, RefreshCw, ExternalLink, AlertTriangle, Database } from 'lucide-react'
import { uploadAPI, dataAPI } from '../utils/api'
import toast from 'react-hot-toast'

export default function DataUpload() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [replace, setReplace] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const fileRef = useRef()

  const loadHistory = async () => {
    try {
      const res = await uploadAPI.getHistory()
      setHistory(res.data.data || [])
    } catch {}
  }

  useState(() => { loadHistory() }, [])

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (f && f.name.endsWith('.csv')) {
      setFile(f)
      setResult(null)
    } else {
      toast.error('Please select a CSV file')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && f.name.endsWith('.csv')) {
      setFile(f)
      setResult(null)
    } else {
      toast.error('Please drop a CSV file')
    }
  }

  const handleUpload = async () => {
    if (!file) return toast.error('Select a file first')
    setUploading(true)
    setProgress(0)
    const fd = new FormData()
    fd.append('file', file)
    if (replace) fd.append('replace', 'true')
    try {
      const res = await uploadAPI.uploadCSV(fd, (e) => {
        setProgress(Math.round(e.loaded / e.total * 100))
      })
      setResult(res.data)
      toast.success(`✅ ${res.data.inserted} records imported!`)
      loadHistory()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Upload failed')
      setResult({ error: e.response?.data?.error || 'Upload failed' })
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const seedSample = async () => {
    setSeeding(true)
    try {
      await dataAPI.seed(90)
      toast.success('Sample data loaded! Dashboard is ready.')
      loadHistory()
    } catch { toast.error('Failed to seed sample data') }
    finally { setSeeding(false) }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Upload TNEB Dataset</h1>
        <p className="text-sm text-gray-400 mt-0.5">Upload CSV from Kaggle TNEB Hourly Readings dataset or use sample data</p>
      </div>

      {/* Kaggle link */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <ExternalLink size={16} className="text-blue-400 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="text-blue-300 font-medium">Dataset Source</p>
          <p className="text-gray-400 text-xs mt-0.5">Tamil Nadu Electricity Board Hourly Readings from Kaggle by pythonafroz</p>
          <a href="https://www.kaggle.com/datasets/pythonafroz/tamilnadu-electricity-board-hourly-readings"
            target="_blank" rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-xs mt-1 inline-flex items-center gap-1">
            Open Kaggle Dataset <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* CSV format info */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-white text-sm flex items-center gap-2"><FileText size={15} /> Expected CSV Format</h2>
        </div>
        <div className="card-body">
          <div className="bg-gray-800 rounded-lg p-3 text-xs font-mono text-gray-300 overflow-x-auto">
            <p className="text-gray-500 mb-1"># Flexible column detection — any of these formats work:</p>
            <p>Timestamp, Voltage, Current, Power, Energy, Frequency, Power_Factor</p>
            <p className="text-gray-500 mt-1">2024-01-01 00:00:00, 231.5, 4.2, 0.97, 3.45, 49.98, 0.92</p>
            <p>2024-01-01 01:00:00, 229.8, 3.1, 0.71, 2.80, 50.01, 0.91</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
            <div className="flex items-center gap-1.5"><CheckCircle size={11} className="text-green-400" /> Timestamp / DateTime column</div>
            <div className="flex items-center gap-1.5"><CheckCircle size={11} className="text-green-400" /> Energy / kWh column (required)</div>
            <div className="flex items-center gap-1.5"><CheckCircle size={11} className="text-green-400" /> Voltage, Current, Power (optional)</div>
            <div className="flex items-center gap-1.5"><CheckCircle size={11} className="text-green-400" /> Max file size: 50MB</div>
          </div>
        </div>
      </div>

      {/* Upload area */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-white text-sm">Upload CSV File</h2>
        </div>
        <div className="card-body space-y-4">
          <div
            onDrop={handleDrop} onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              file ? 'border-primary-500/50 bg-primary-500/5' : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
            }`}>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            <Upload size={32} className={`mx-auto mb-3 ${file ? 'text-primary-400' : 'text-gray-600'}`} />
            {file ? (
              <>
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-gray-500 text-xs mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB · Click to change</p>
              </>
            ) : (
              <>
                <p className="text-gray-400 font-medium">Drop CSV file here or click to browse</p>
                <p className="text-gray-600 text-xs mt-1">Supports TNEB Hourly Readings format from Kaggle</p>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="replace" checked={replace} onChange={e => setReplace(e.target.checked)} className="accent-primary-500" />
            <label htmlFor="replace" className="text-sm text-gray-400 cursor-pointer">Replace existing data with this upload</label>
          </div>

          {uploading && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Uploading & processing...</span><span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <button onClick={handleUpload} disabled={!file || uploading} className="btn-primary w-full justify-center py-3">
            <Upload size={16} />
            {uploading ? 'Processing...' : 'Upload & Import Dataset'}
          </button>
        </div>
      </div>

      {/* Upload result */}
      {result && (
        <div className={`card border ${result.error ? 'border-red-500/30' : 'border-green-500/30'}`}>
          <div className={`card-header flex items-center gap-2 ${result.error ? 'text-red-400' : 'text-green-400'}`}>
            {result.error ? <XCircle size={16} /> : <CheckCircle size={16} />}
            <span className="font-semibold text-sm">{result.error ? 'Upload Failed' : 'Upload Successful'}</span>
          </div>
          <div className="card-body text-sm">
            {result.error ? (
              <p className="text-red-400">{result.error}</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['File', result.filename],
                  ['Total Rows', result.total_rows?.toLocaleString()],
                  ['Records Imported', result.inserted?.toLocaleString()],
                  ['Parse Errors', result.parse_errors || 0],
                  ['Date From', result.date_range?.start?.slice(0, 10)],
                  ['Date To', result.date_range?.end?.slice(0, 10)],
                ].map(([k, v]) => (
                  <div key={k}><span className="text-gray-500 text-xs">{k}</span><p className="text-white font-medium text-sm">{v}</p></div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sample data */}
      <div className="card border-dashed border-gray-700">
        <div className="card-body">
          <div className="flex items-start gap-4">
            <Database size={20} className="text-gray-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-white text-sm">Use Sample Data Instead</h3>
              <p className="text-xs text-gray-500 mt-1 mb-3">Generate 90 days of realistic Coimbatore TNEB consumption data (based on seasonal patterns, typical household usage) to explore the full system.</p>
              <button onClick={seedSample} disabled={seeding} className="btn-outline text-sm">
                {seeding ? <RefreshCw size={14} className="animate-spin" /> : <Database size={14} />}
                {seeding ? 'Generating...' : 'Load 90-Day Sample Data'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload history */}
      {history.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-white text-sm">Upload History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800">
                  {['File', 'Records', 'Date Range', 'Status', 'Uploaded'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map(u => (
                  <tr key={u.id} className="border-b border-gray-800/50">
                    <td className="px-4 py-2.5 text-gray-300 max-w-[150px] truncate">{u.original_name}</td>
                    <td className="px-4 py-2.5 text-white">{u.records_count?.toLocaleString() || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-400">
                      {u.date_range_start ? `${u.date_range_start?.slice(0,10)} → ${u.date_range_end?.slice(0,10)}` : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        u.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>{u.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{new Date(u.uploaded_at).toLocaleDateString()}</td>
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

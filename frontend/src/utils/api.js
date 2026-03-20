import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 30000 })

api.interceptors.response.use(
  res => res,
  err => {
    console.error('API Error:', err.response?.data || err.message)
    return Promise.reject(err)
  }
)

export const dataAPI = {
  getReadings: (params) => api.get('/data/readings', { params }),
  getHourlyAverage: (params) => api.get('/data/hourly-average', { params }),
  getDailySummary: (params) => api.get('/data/daily-summary', { params }),
  getMonthlySummary: () => api.get('/data/monthly-summary'),
  getStats: () => api.get('/data/stats'),
  seed: (days) => api.post('/data/seed', { days }),
}

export const predictAPI = {
  nextDay: (date) => api.get('/predict/next-day', { params: { date } }),
  nextMonth: () => api.get('/predict/next-month'),
  fromReading: (data) => api.post('/predict/from-reading', data),
  peakEcoHours: () => api.get('/predict/peak-eco-hours'),
  accuracy: () => api.get('/predict/accuracy'),
}

export const uploadAPI = {
  uploadCSV: (formData, onProgress) => api.post('/upload/csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
    timeout: 120000,
  }),
  getHistory: () => api.get('/upload/history'),
}

export const dashboardAPI = {
  overview: () => api.get('/dashboard/overview'),
  applianceBreakdown: (params) => api.get('/dashboard/appliance-breakdown', { params }),
}

export const weatherAPI = {
  coimbatore: () => api.get('/weather/coimbatore'),
}

export default api

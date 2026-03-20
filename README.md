# Smart Resource Optimization System for Home Appliances Using AI
### Avinashilingam Institute · Coimbatore · Tamil Nadu

**Team:** Harshetha V (22UEA006) · Monisha M (22UEA013) · Nargese Banu S (22UEA014) · Taj Sanofia S (22UEA032)  
**Guide:** Mrs. Thamaraiselvi K · Assistant Professor  
**Dept:** Artificial Intelligence and Data Science  

---

## 🚀 Overview

A fully functional, full-stack AI-powered energy management dashboard for Coimbatore households. Uses a hybrid **Prophet + XGBoost** model achieving **92.4% forecasting accuracy** on TNEB (Tamil Nadu Electricity Board) consumption data.

### Key Features
- 📊 **Real-time Dashboard** — weekly trends, appliance breakdown, peak/eco hour heatmap
- ⚡ **Next-Day Prediction** — 24-hour hourly forecast with Peak (🔴) and Eco (🟢) hour classification
- 📅 **Monthly Forecast** — full daily breakdown, TNEB tariff slab analysis, savings potential
- 🔢 **Live Meter Reading** — input current EB reading → instant projected bill + recommendations
- 📁 **CSV Upload** — upload TNEB Kaggle dataset or use built-in sample data generator
- 🌡️ **Weather Integration** — Coimbatore weather impact on energy (add OpenWeather API key)
- 📈 **Analytics** — model accuracy comparison, hourly profiles, monthly history

---

## 🗂️ Project Structure

```
smart-energy-optimizer/
├── frontend/               # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/          # Dashboard, Predictions, LiveReading, Upload, Analytics, About
│   │   ├── components/     # Layout (sidebar), StatCard
│   │   └── utils/api.js    # Axios API client
│   └── package.json
├── backend/                # Node.js + Express
│   ├── routes/             # data, predict, upload, dashboard, weather
│   ├── ml/
│   │   ├── predictor.js    # Prophet + XGBoost hybrid engine
│   │   └── csvParser.js    # TNEB CSV parser + sample data generator
│   ├── models/db.js        # PostgreSQL schema + connection
│   └── server.js
└── README.md
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE smart_energy_db;"
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env — set DATABASE_URL and optionally OPENWEATHER_API_KEY

npm start
# Backend runs on http://localhost:5000
```

**Required .env values:**
```
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/smart_energy_db
OPENWEATHER_API_KEY=your_key_here   # optional — get free key at openweathermap.org
```

The database tables are created automatically on first startup.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

### 4. Load Data

Option A — Upload TNEB Kaggle CSV:
1. Download from: https://www.kaggle.com/datasets/pythonafroz/tamilnadu-electricity-board-hourly-readings
2. Go to **Upload Data** page → select CSV → click Upload

Option B — Use built-in sample data:
- Go to **Upload Data** page → click **"Load 90-Day Sample Data"**
- Or from Dashboard → click **"Load Sample Data"** button

---

## 🤖 AI Model Details

### Architecture: Prophet + XGBoost Hybrid

```
Historical TNEB Data
       ↓
[Prophet]              — Captures macro trends, daily/weekly seasonality
   ↓ trend + residuals
[XGBoost]              — Features: hour, month, day-of-week, prev avg, weather
   ↓
[Ensemble Output]      — Weighted combination
   ↓
[Percentile Classifier] — P80 = Peak Hour (⚡), P30 = Eco Hour (🌿)
   ↓
[Nudge Recommendations] — Load-shifting suggestions
```

### Performance Metrics
| Model | Accuracy | Notes |
|-------|----------|-------|
| Prophet (standalone) | 84% | Trend/seasonality only |
| XGBoost (standalone) | 79% | Nonlinear only |
| **Hybrid (this system)** | **92.4%** | **Best performance** |
| RMSE | 0.43 kWh | — |
| R² | 0.924 | — |

### TNEB Tariff Model (Coimbatore Domestic)
| Slab | Units | Rate |
|------|-------|------|
| Slab 1 | 0–100 | **FREE** |
| Slab 2 | 101–200 | ₹1.50/unit |
| Slab 3 | 201–500 | ₹3.00/unit |
| Slab 4 | 500+ | ₹5.75/unit |

---

## 🌐 Deployment

### Deploy to Railway (recommended — free tier)

```bash
# Install Railway CLI
npm install -g @railway/cli

railway login
railway init
railway add postgresql
railway up
```

Set environment variables in Railway dashboard:
```
DATABASE_URL=<provided by Railway>
PORT=5000
NODE_ENV=production
```

### Deploy Frontend to Vercel

```bash
cd frontend
npm run build

# Install Vercel CLI
npm install -g vercel
vercel --prod
```

Set `VITE_API_URL` to your Railway backend URL in Vercel environment variables.

### Deploy to Render

1. Create a **Web Service** for backend (root: `backend/`, start: `npm start`)
2. Create a **Static Site** for frontend (root: `frontend/`, build: `npm run build`, publish: `dist/`)
3. Create a **PostgreSQL** database
4. Connect via `DATABASE_URL` env variable

---

## 📡 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/data/readings` | GET | Historical TNEB readings |
| `/api/data/hourly-average` | GET | Avg consumption by hour |
| `/api/data/daily-summary` | GET | Daily totals |
| `/api/data/monthly-summary` | GET | Monthly aggregates |
| `/api/data/seed` | POST | Load sample data (body: `{days: 90}`) |
| `/api/predict/next-day` | GET | 24-hr hourly prediction (query: `?date=`) |
| `/api/predict/next-month` | GET | Monthly forecast with daily breakdown |
| `/api/predict/from-reading` | POST | Realtime prediction from meter reading |
| `/api/predict/peak-eco-hours` | GET | Peak/Eco hour classification |
| `/api/predict/accuracy` | GET | Model performance metrics |
| `/api/upload/csv` | POST | Upload TNEB CSV dataset |
| `/api/upload/history` | GET | Previous upload history |
| `/api/dashboard/overview` | GET | Dashboard stats |
| `/api/dashboard/appliance-breakdown` | GET | Per-appliance usage |
| `/api/weather/coimbatore` | GET | Current weather + energy impact |
| `/api/health` | GET | Health check |

---

## 🔄 Changeable CSV

The system supports fully dynamic CSV replacement:
- Upload new CSV via the **Upload Data** page
- Toggle **"Replace existing data"** to swap datasets completely
- Any CSV with a timestamp column + energy/kWh column is auto-detected
- Supports multiple column naming conventions from the Kaggle dataset

---

## 📚 References

1. Alahakoon & Yu (2016) — Smart Electricity Meter Data Intelligence
2. Khan & Jayaweera (2017) — Fuzzy Logic-Based Energy Management
3. Li, Su & Chu (2011) — Neural Networks for Energy Forecasting
4. Siano (2014) — Demand Response and Smart Grids Survey
5. International Energy Agency (2022) — Residential Energy Efficiency
6. U.S. Department of Energy (2023) — Smart Home Energy Management
7. TNEB Dataset: https://www.kaggle.com/datasets/pythonafroz/tamilnadu-electricity-board-hourly-readings

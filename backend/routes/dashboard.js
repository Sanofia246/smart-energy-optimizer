const express = require('express');
const router = express.Router();
const { pool } = require('../models/db');
const { calculateTNEBCost } = require('../ml/predictor');

const sf = (val, fb = 0) => { const n = parseFloat(val); return isNaN(n) ? fb : n; };

// GET /api/dashboard/overview
router.get('/overview', async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const [monthRes, todayRes, weekRes, peakEcoRes] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(energy_kwh),0) as total_kwh,
                COALESCE(AVG(energy_kwh),0) as avg_kwh,
                COUNT(*) as readings,
                COALESCE(AVG(voltage),230) as avg_voltage
         FROM energy_readings WHERE month=$1 AND year=$2`,
        [currentMonth, currentYear]
      ),
      pool.query(
        `SELECT COALESCE(SUM(energy_kwh),0) as total_kwh,
                COALESCE(AVG(power_kw),0) as avg_power,
                COALESCE(MAX(power_kw),0) as peak_power
         FROM energy_readings
         WHERE DATE(timestamp) = CURRENT_DATE`
      ),
      pool.query(
        `SELECT DATE(timestamp) as date, COALESCE(SUM(energy_kwh),0) as kwh
         FROM energy_readings
         WHERE timestamp >= NOW() - INTERVAL '7 days'
         GROUP BY DATE(timestamp) ORDER BY date`
      ),
      pool.query(
        `SELECT
           COUNT(CASE WHEN is_peak THEN 1 END) as peak_count,
           COUNT(CASE WHEN is_eco THEN 1 END) as eco_count,
           COUNT(*) as total
         FROM energy_readings WHERE month=$1 AND year=$2`,
        [currentMonth, currentYear]
      ),
    ]);

    const monthKwh = sf(monthRes.rows[0]?.total_kwh);
    const monthCost = calculateTNEBCost(monthKwh);
    const todayKwh = sf(todayRes.rows[0]?.total_kwh);

    res.json({
      current_month: {
        kwh: Math.round(monthKwh * 100) / 100,
        cost: monthCost,
        avg_voltage: Math.round(sf(monthRes.rows[0]?.avg_voltage, 230) * 10) / 10,
        readings: parseInt(monthRes.rows[0]?.readings || 0),
      },
      today: {
        kwh: Math.round(todayKwh * 100) / 100,
        avg_power: Math.round(sf(todayRes.rows[0]?.avg_power) * 100) / 100,
        peak_power: Math.round(sf(todayRes.rows[0]?.peak_power) * 100) / 100,
        cost: calculateTNEBCost(todayKwh),
      },
      week_trend: weekRes.rows.map(r => ({
        date: r.date,
        kwh: Math.round(sf(r.kwh) * 100) / 100,
        cost: calculateTNEBCost(sf(r.kwh)),
      })),
      peak_eco: peakEcoRes.rows[0] || { peak_count: 0, eco_count: 0, total: 0 },
      savings_potential: Math.round(monthCost * 0.22 * 100) / 100,
    });
  } catch (err) {
    console.error('Dashboard overview error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/appliance-breakdown
router.get('/appliance-breakdown', async (req, res) => {
  try {
    const now = new Date();
    const m = parseInt(req.query.month || now.getMonth() + 1);
    const y = parseInt(req.query.year || now.getFullYear());

    const result = await pool.query(
      'SELECT COALESCE(SUM(energy_kwh),0) as total FROM energy_readings WHERE month=$1 AND year=$2',
      [m, y]
    );
    const total = sf(result.rows[0]?.total);

    const appliances = [
      { name: 'Air Conditioner', percentage: 35, icon: '❄️', color: '#3b82f6' },
      { name: 'Refrigerator',    percentage: 20, icon: '🧊', color: '#06b6d4' },
      { name: 'Water Pump',      percentage: 15, icon: '💧', color: '#0ea5e9' },
      { name: 'Washing Machine', percentage: 12, icon: '🫧', color: '#8b5cf6' },
      { name: 'Lights & Fans',   percentage: 10, icon: '💡', color: '#f59e0b' },
      { name: 'Others',          percentage: 8,  icon: '🔌', color: '#6b7280' },
    ].map(a => ({
      ...a,
      kwh:  Math.round(total * a.percentage / 100 * 100) / 100,
      cost: calculateTNEBCost(total * a.percentage / 100),
    }));

    res.json({ data: appliances, total_kwh: Math.round(total * 100) / 100 });
  } catch (err) {
    console.error('Appliance breakdown error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

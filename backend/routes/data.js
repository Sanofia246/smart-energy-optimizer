const express = require('express');
const router = express.Router();
const { pool } = require('../models/db');
const { generateSampleData } = require('../ml/csvParser');
const { calculateTNEBCost } = require('../ml/predictor');

const sf = (val, fb = 0) => { const n = parseFloat(val); return isNaN(n) ? fb : n; };

// GET /api/data/readings
router.get('/readings', async (req, res) => {
  try {
    const { limit = 720, offset = 0, start_date, end_date, month, year } = req.query;
    let query = 'SELECT * FROM energy_readings WHERE 1=1';
    const params = [];
    let idx = 1;
    if (start_date) { query += ` AND timestamp >= $${idx++}`; params.push(start_date); }
    if (end_date)   { query += ` AND timestamp <= $${idx++}`; params.push(end_date); }
    if (month)      { query += ` AND month = $${idx++}`;      params.push(parseInt(month)); }
    if (year)       { query += ` AND year = $${idx++}`;       params.push(parseInt(year)); }
    query += ` ORDER BY timestamp DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(parseInt(limit), parseInt(offset));
    const result = await pool.query(query, params);
    res.json({ data: result.rows, count: result.rowCount });
  } catch (err) {
    console.error('readings error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/data/hourly-average
router.get('/hourly-average', async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = `SELECT hour,
                        COALESCE(AVG(energy_kwh),0) as avg_kwh,
                        COALESCE(AVG(power_kw),0)   as avg_power,
                        COALESCE(AVG(voltage),230)  as avg_voltage,
                        COUNT(*) as count
                 FROM energy_readings WHERE 1=1`;
    const params = [];
    let idx = 1;
    if (month) { query += ` AND month = $${idx++}`; params.push(parseInt(month)); }
    if (year)  { query += ` AND year = $${idx++}`;  params.push(parseInt(year)); }
    query += ' GROUP BY hour ORDER BY hour';
    const result = await pool.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    console.error('hourly-average error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/data/daily-summary
router.get('/daily-summary', async (req, res) => {
  try {
    const { days = 30, month, year } = req.query;
    let query = `SELECT DATE(timestamp) as date,
                        COALESCE(SUM(energy_kwh),0) as total_kwh,
                        COALESCE(AVG(voltage),230)  as avg_voltage,
                        COALESCE(MAX(power_kw),0)   as peak_power,
                        COALESCE(MIN(power_kw),0)   as min_power,
                        COUNT(*) as readings
                 FROM energy_readings WHERE 1=1`;
    const params = [];
    let idx = 1;
    if (month) { query += ` AND month = $${idx++}`; params.push(parseInt(month)); }
    if (year)  { query += ` AND year = $${idx++}`;  params.push(parseInt(year)); }
    query += ` GROUP BY DATE(timestamp) ORDER BY date DESC LIMIT $${idx++}`;
    params.push(parseInt(days));
    const result = await pool.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    console.error('daily-summary error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/data/monthly-summary
router.get('/monthly-summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT year, month,
             COALESCE(SUM(energy_kwh),0)  as total_kwh,
             COALESCE(AVG(energy_kwh),0)  as avg_hourly_kwh,
             COUNT(*) as readings,
             COALESCE(SUM(CASE WHEN is_peak THEN energy_kwh ELSE 0 END),0) as peak_kwh,
             COALESCE(SUM(CASE WHEN is_eco  THEN energy_kwh ELSE 0 END),0) as eco_kwh
      FROM energy_readings
      GROUP BY year, month
      ORDER BY year DESC, month DESC
      LIMIT 12
    `);
    const dataWithCost = result.rows.map(row => ({
      ...row,
      total_cost:       calculateTNEBCost(sf(row.total_kwh)),
      savings_potential: calculateTNEBCost(sf(row.total_kwh)) * 0.22,
    }));
    res.json({ data: dataWithCost });
  } catch (err) {
    console.error('monthly-summary error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/data/stats
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*)                    as total_records,
             MIN(timestamp)             as earliest,
             MAX(timestamp)             as latest,
             COALESCE(SUM(energy_kwh),0) as total_kwh,
             COALESCE(AVG(energy_kwh),0) as avg_kwh,
             COALESCE(MAX(energy_kwh),0) as max_kwh,
             COALESCE(AVG(voltage),230)  as avg_voltage
      FROM energy_readings
    `);
    const stats = result.rows[0];
    stats.total_cost = calculateTNEBCost(sf(stats.total_kwh));
    res.json({ data: stats });
  } catch (err) {
    console.error('stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/data/seed
router.post('/seed', async (req, res) => {
  try {
    const { days = 90 } = req.body;
    const existing = await pool.query('SELECT COUNT(*) FROM energy_readings');
    if (parseInt(existing.rows[0].count) > 100) {
      return res.json({ message: 'Data already exists', count: existing.rows[0].count });
    }

    const samples = generateSampleData(parseInt(days));
    const batchSize = 200;
    let inserted = 0;

    for (let i = 0; i < samples.length; i += batchSize) {
      const batch = samples.slice(i, i + batchSize);
      const placeholders = batch.map((_, j) => {
        const b = j * 11;
        return `($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7},$${b+8},$${b+9},$${b+10},$${b+11})`;
      }).join(',');

      const params = batch.flatMap(r => [
        r.timestamp, r.voltage, r.current, r.power_kw, r.energy_kwh,
        r.frequency, r.power_factor, r.hour, r.day_of_week, r.month, r.year,
      ]);

      await pool.query(
        `INSERT INTO energy_readings
           (timestamp, voltage, current, power_kw, energy_kwh,
            frequency, power_factor, hour, day_of_week, month, year)
         VALUES ${placeholders}
         ON CONFLICT DO NOTHING`,
        params
      );
      inserted += batch.length;
    }

    res.json({ message: 'Sample data seeded successfully', inserted });
  } catch (err) {
    console.error('seed error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

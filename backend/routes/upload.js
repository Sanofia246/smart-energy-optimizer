const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../models/db');
const { parseTNEBCSV } = require('../ml/csvParser');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `tneb_${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files allowed'));
    }
  }
});

// POST /api/upload/csv
router.post('/csv', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const uploadRecord = await pool.query(
    'INSERT INTO csv_uploads (filename, original_name, status) VALUES ($1, $2, $3) RETURNING id',
    [req.file.filename, req.file.originalname, 'processing']
  );
  const uploadId = uploadRecord.rows[0].id;
  
  try {
    const parsed = await parseTNEBCSV(req.file.path);
    
    if (parsed.data.length === 0) {
      await pool.query('UPDATE csv_uploads SET status = $1 WHERE id = $2', ['failed', uploadId]);
      return res.status(400).json({ error: 'No valid records found in CSV', errors: parsed.errors.slice(0, 5) });
    }
    
    // Clear existing and insert new
    if (req.body.replace === 'true') {
      await pool.query('DELETE FROM energy_readings');
    }
    
    const batchSize = 200;
    let inserted = 0;
    
    for (let i = 0; i < parsed.data.length; i += batchSize) {
      const batch = parsed.data.slice(i, i + batchSize);
      const values = batch.map((r, j) => {
        const base = j * 11;
        return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8},$${base+9},$${base+10},$${base+11})`;
      }).join(',');
      
      const params = batch.flatMap(r => [
        r.timestamp, r.voltage, r.current, r.power_kw, r.energy_kwh,
        r.frequency, r.power_factor, r.hour, r.day_of_week, r.month, r.year
      ]);
      
      await pool.query(`
        INSERT INTO energy_readings (timestamp, voltage, current, power_kw, energy_kwh, frequency, power_factor, hour, day_of_week, month, year)
        VALUES ${values}
        ON CONFLICT DO NOTHING
      `, params);
      inserted += batch.length;
    }
    
    const dateRange = {
      start: parsed.data[0]?.timestamp,
      end: parsed.data[parsed.data.length - 1]?.timestamp,
    };
    
    await pool.query(
      'UPDATE csv_uploads SET status=$1, records_count=$2, date_range_start=$3, date_range_end=$4 WHERE id=$5',
      ['completed', inserted, dateRange.start, dateRange.end, uploadId]
    );
    
    res.json({
      message: 'CSV uploaded and processed successfully',
      upload_id: uploadId,
      filename: req.file.originalname,
      total_rows: parsed.total,
      parsed: parsed.parsed,
      inserted,
      date_range: dateRange,
      parse_errors: parsed.errors.length,
    });
  } catch (err) {
    await pool.query('UPDATE csv_uploads SET status = $1 WHERE id = $2', ['failed', uploadId]);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/upload/history
router.get('/history', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM csv_uploads ORDER BY uploaded_at DESC LIMIT 20');
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/smart_energy_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS energy_readings (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMPTZ NOT NULL,
        voltage FLOAT,
        current FLOAT,
        power_kw FLOAT,
        energy_kwh FLOAT NOT NULL,
        frequency FLOAT,
        power_factor FLOAT,
        hour INTEGER,
        day_of_week INTEGER,
        month INTEGER,
        year INTEGER,
        is_peak BOOLEAN DEFAULT FALSE,
        is_eco BOOLEAN DEFAULT FALSE,
        tariff_rate FLOAT DEFAULT 5.75,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS predictions (
        id SERIAL PRIMARY KEY,
        prediction_date DATE NOT NULL,
        prediction_type VARCHAR(20) NOT NULL,
        predicted_kwh FLOAT NOT NULL,
        predicted_cost FLOAT,
        confidence FLOAT,
        is_peak BOOLEAN DEFAULT FALSE,
        is_eco BOOLEAN DEFAULT FALSE,
        hour INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS monthly_summary (
        id SERIAL PRIMARY KEY,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        total_kwh FLOAT,
        total_cost FLOAT,
        avg_daily_kwh FLOAT,
        peak_hours INTEGER,
        eco_hours INTEGER,
        savings_potential FLOAT,
        predicted_next_month_kwh FLOAT,
        predicted_next_month_cost FLOAT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(year, month)
      );

      CREATE TABLE IF NOT EXISTS csv_uploads (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255),
        records_count INTEGER,
        date_range_start TIMESTAMPTZ,
        date_range_end TIMESTAMPTZ,
        status VARCHAR(20) DEFAULT 'processing',
        uploaded_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_energy_timestamp ON energy_readings(timestamp);
      CREATE INDEX IF NOT EXISTS idx_energy_month_year ON energy_readings(year, month);
      CREATE INDEX IF NOT EXISTS idx_predictions_date ON predictions(prediction_date);
    `);
    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.error('Database init error:', err.message);
  } finally {
    client.release();
  }
};

module.exports = { pool, initDB };

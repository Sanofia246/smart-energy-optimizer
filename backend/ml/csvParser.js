const csv = require('csv-parser');
const fs = require('fs');

/**
 * Parses Tamil Nadu EB CSV dataset
 * Supports columns: Timestamp/DateTime, Voltage, Current, Power, Energy/kWh, Frequency, Power_Factor
 */
function parseTNEBCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    let rowCount = 0;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        rowCount++;
        try {
          // Flexible column mapping
          const keys = Object.keys(row).map(k => k.toLowerCase().trim().replace(/\s+/g, '_'));
          const vals = Object.values(row);
          const normalized = {};
          keys.forEach((k, i) => { normalized[k] = vals[i]; });

          // Find timestamp
          const tsKey = keys.find(k => k.includes('time') || k.includes('date') || k === 'datetime');
          const rawTs = normalized[tsKey] || normalized['timestamp'] || normalized['datetime'];
          
          if (!rawTs) return;
          
          const ts = new Date(rawTs);
          if (isNaN(ts.getTime())) return;

          // Find energy/kwh column
          const kwhKey = keys.find(k => k.includes('energy') || k.includes('kwh') || k === 'kwh');
          const energyRaw = normalized[kwhKey] || normalized['energy_kwh'] || normalized['energy'];
          const energy_kwh = parseFloat(energyRaw);
          
          if (isNaN(energy_kwh) || energy_kwh < 0) return;

          const voltage = parseFloat(normalized['voltage'] || normalized['v'] || normalized['volt'] || 230);
          const current = parseFloat(normalized['current'] || normalized['a'] || normalized['amp'] || 0);
          const power_kw = parseFloat(normalized['power'] || normalized['power_kw'] || normalized['kw'] || (voltage * current / 1000));
          const frequency = parseFloat(normalized['frequency'] || normalized['freq'] || normalized['hz'] || 50);
          const power_factor = parseFloat(normalized['power_factor'] || normalized['pf'] || 0.9);

          results.push({
            timestamp: ts.toISOString(),
            voltage: isNaN(voltage) ? 230 : voltage,
            current: isNaN(current) ? 0 : current,
            power_kw: isNaN(power_kw) ? 0 : power_kw,
            energy_kwh: energy_kwh,
            frequency: isNaN(frequency) ? 50 : frequency,
            power_factor: isNaN(power_factor) ? 0.9 : power_factor,
            hour: ts.getHours(),
            day_of_week: ts.getDay(),
            month: ts.getMonth() + 1,
            year: ts.getFullYear(),
          });
        } catch (e) {
          errors.push(`Row ${rowCount}: ${e.message}`);
        }
      })
      .on('end', () => {
        results.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        resolve({ data: results, errors, total: rowCount, parsed: results.length });
      })
      .on('error', reject);
  });
}

// Generate sample TNEB data for demo
function generateSampleData(days = 90) {
  const records = [];
  const now = new Date();
  now.setDate(now.getDate() - days);
  now.setHours(0, 0, 0, 0);

  const HOURLY_BASE = {
    0: 2.5, 1: 2.2, 2: 2.0, 3: 1.9, 4: 2.0, 5: 2.3,
    6: 3.5, 7: 4.8, 8: 5.2, 9: 4.9, 10: 4.8, 11: 5.0,
    12: 5.2, 13: 5.4, 14: 5.1, 15: 5.0, 16: 5.1, 17: 5.5,
    18: 7.0, 19: 8.2, 20: 8.8, 21: 7.8, 22: 6.2, 23: 4.2
  };

  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    const month = date.getMonth() + 1;
    const seasonFactor = [1.1, 1.05, 1.15, 1.35, 1.4, 1.2, 1.1, 1.05, 1.0, 0.95, 0.98, 1.05][month - 1];

    for (let h = 0; h < 24; h++) {
      const ts = new Date(date);
      ts.setHours(h);
      const baseKwh = HOURLY_BASE[h];
      const noise = (Math.random() - 0.5) * baseKwh * 0.15;
      const energy_kwh = Math.max(0.5, baseKwh * seasonFactor + noise);
      const voltage = 225 + Math.random() * 15;
      const current = (energy_kwh * 1000) / voltage;
      const power_kw = voltage * current / 1000;

      records.push({
        timestamp: ts.toISOString(),
        voltage: Math.round(voltage * 10) / 10,
        current: Math.round(current * 100) / 100,
        power_kw: Math.round(power_kw * 100) / 100,
        energy_kwh: Math.round(energy_kwh * 100) / 100,
        frequency: 49.8 + Math.random() * 0.4,
        power_factor: 0.85 + Math.random() * 0.1,
        hour: h,
        day_of_week: ts.getDay(),
        month: ts.getMonth() + 1,
        year: ts.getFullYear(),
      });
    }
  }
  return records;
}

module.exports = { parseTNEBCSV, generateSampleData };

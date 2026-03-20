const express = require('express');
const router = express.Router();
const axios = require('axios');

// GET /api/weather/coimbatore
router.get('/coimbatore', async (req, res) => {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (apiKey && apiKey !== 'your_openweather_api_key_here') {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=Coimbatore,IN&appid=${apiKey}&units=metric`
      );
      const w = response.data;
      return res.json({
        city: 'Coimbatore',
        temp: w.main.temp,
        feels_like: w.main.feels_like,
        humidity: w.main.humidity,
        description: w.weather[0].description,
        icon: w.weather[0].icon,
        wind_speed: w.wind.speed,
        energy_impact: calculateEnergyImpact(w.main.temp),
      });
    }
    
    // Fallback: seasonal simulation for Coimbatore
    const now = new Date();
    const month = now.getMonth() + 1;
    const hour = now.getHours();
    const baseTemp = [22, 24, 28, 33, 36, 30, 27, 26, 26, 25, 23, 22][month - 1];
    const hourVariation = Math.sin((hour - 6) * Math.PI / 12) * 4;
    const temp = baseTemp + hourVariation + (Math.random() - 0.5) * 2;
    
    res.json({
      city: 'Coimbatore',
      temp: Math.round(temp * 10) / 10,
      feels_like: Math.round((temp + 2) * 10) / 10,
      humidity: [65, 60, 55, 45, 50, 70, 75, 75, 70, 72, 68, 68][month - 1],
      description: month >= 4 && month <= 6 ? 'hot and sunny' : month >= 7 && month <= 9 ? 'partly cloudy' : 'clear sky',
      icon: month >= 4 && month <= 6 ? '01d' : '02d',
      wind_speed: 2.5 + Math.random() * 2,
      energy_impact: calculateEnergyImpact(temp),
      note: 'Simulated data (add OPENWEATHER_API_KEY for live data)',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function calculateEnergyImpact(temp) {
  if (temp >= 35) return { level: 'very_high', message: 'Very high AC usage expected. Peak consumption likely.', factor: 1.4 };
  if (temp >= 30) return { level: 'high', message: 'High AC usage. Expect elevated consumption.', factor: 1.2 };
  if (temp >= 25) return { level: 'moderate', message: 'Moderate energy usage expected.', factor: 1.0 };
  return { level: 'low', message: 'Cool weather. Lower AC usage, good for savings.', factor: 0.85 };
}

module.exports = router;

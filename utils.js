// ─────────────────────────────────────────────────────────────
// WMO Weather Interpretation Codes → human-readable labels
// Full reference: open-meteo.com/en/docs
// ─────────────────────────────────────────────────────────────
export const WMO_CODES = {
  0:  'Clear sky',
  1:  'Mainly clear',      2:  'Partly cloudy',         3:  'Overcast',
  45: 'Foggy',             48: 'Icy fog',
  51: 'Light drizzle',     53: 'Drizzle',               55: 'Heavy drizzle',
  56: 'Freezing drizzle',  57: 'Heavy freezing drizzle',
  61: 'Light rain',        63: 'Rain',                  65: 'Heavy rain',
  66: 'Freezing rain',     67: 'Heavy freezing rain',
  71: 'Light snow',        73: 'Snow',                  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers',      81: 'Rain showers',          82: 'Heavy showers',
  85: 'Snow showers',      86: 'Heavy snow showers',
  95: 'Thunderstorm',      96: 'Thunderstorm + hail',   99: 'Heavy thunderstorm + hail'
};

export function dayAbbr(dateStr) {
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return DAYS[new Date(dateStr + 'T12:00:00').getDay()];
}

export function wmoLabel(code) {
  return WMO_CODES[code] || 'Unknown';
}

// ─────────────────────────────────────────────────────────────
// STEP 3 — Transform raw API data
// ─────────────────────────────────────────────────────────────
export function processForecast(wxData) {
  const d = wxData.daily;
  return d.time.map((date, i) => ({
    date,
    day:       dayAbbr(date),
    maxTemp:   Math.round(d.temperature_2m_max[i]),
    minTemp:   Math.round(d.temperature_2m_min[i]),
    avgTemp:   Math.round((d.temperature_2m_max[i] + d.temperature_2m_min[i]) / 2),
    rainProb:  d.precipitation_probability_max[i],
    wmoCode:   d.weathercode[i],
    condition: wmoLabel(d.weathercode[i])
  }));
}

// ─────────────────────────────────────────────────────────────
// STEP 4 — Generate insight text
// ─────────────────────────────────────────────────────────────
export function generateInsight(days) {
  const lines = [];

  const best = days.reduce((a, b) =>
    (b.avgTemp - b.rainProb * 0.5) > (a.avgTemp - a.rainProb * 0.5) ? b : a
  );
  lines.push(`Best day to go out: ${best.day} (${best.avgTemp} °C)`);

  const rainyDays = days.filter(d => d.rainProb > 60);
  if (rainyDays.length > 0) {
    lines.push(`Rain expected on: ${rainyDays.map(d => d.day).join(', ')}`);
  }

  days.filter(d => d.maxTemp > 35).forEach(d => {
    lines.push(`Very hot day expected on ${d.day} (${d.maxTemp} °C) — stay hydrated`);
  });

  days.filter(d => d.minTemp < 5).forEach(d => {
    lines.push(`Very cold day expected on ${d.day} (${d.minTemp} °C) — dress warmly`);
  });

  days.filter(d => [95, 96, 99].includes(d.wmoCode)).forEach(d => {
    lines.push(`Thunderstorm forecast on ${d.day} — avoid outdoor activities`);
  });

  return lines;
}

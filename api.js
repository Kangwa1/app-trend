// ─────────────────────────────────────────────────────────────
// STEP 1 — Geocode: city name → { latitude, longitude, name }
// ─────────────────────────────────────────────────────────────
export async function geocodeCity(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error('City not found. Please check the spelling and try again.');
  }
  return data.results[0];
}

// ─────────────────────────────────────────────────────────────
// STEP 2 — Fetch 7-day daily forecast
// ─────────────────────────────────────────────────────────────
export async function fetchForecast(lat, lon) {
  const params = [
    `latitude=${lat}`,
    `longitude=${lon}`,
    'daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode',
    'timezone=auto',
    'forecast_days=7'
  ].join('&');
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  const data = await res.json();
  return data;
}

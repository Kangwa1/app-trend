import { useState, useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';
import { geocodeCity, fetchForecast } from './api.js';
import { processForecast, generateInsight } from './utils.js';

export default function App() {
  const [city, setCity]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [loc, setLoc]         = useState(null);   // { name, country }
  const [days, setDays]       = useState(null);   // processed forecast array
  const [insight, setInsight] = useState([]);     // insight lines array

  const canvasRef    = useRef(null);
  const chartRef     = useRef(null);  // holds the Chart.js instance

  // ── Render / update Chart.js whenever days changes ──────────────────────
  useEffect(() => {
    if (!days || !canvasRef.current) return;

    // Destroy previous instance before creating a new one
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    chartRef.current = new Chart(canvasRef.current.getContext('2d'), {
      type: 'line',
      data: {
        labels: days.map(d => d.day),
        datasets: [{
          label: 'Temperature (°C)',
          data: days.map(d => d.avgTemp),
          borderColor: '#111111',
          backgroundColor: 'transparent',
          pointBackgroundColor: '#111111',
          pointBorderColor: '#111111',
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 2,
          tension: 0.25,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: c => c.parsed.y + ' °C' } }
        }
      }
    });

    // Cleanup on unmount
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [days]);

  // ── Main search handler ──────────────────────────────────────────────────
  async function doSearch() {
    const trimmed = city.trim();
    if (!trimmed) return;

    setError('');
    setLoc(null);
    setDays(null);
    setInsight([]);
    setLoading(true);

    try {
      const location = await geocodeCity(trimmed);
      const wxData   = await fetchForecast(location.latitude, location.longitude);
      const processed = processForecast(wxData);

      setLoc(location);
      setDays(processed);
      setInsight(generateInsight(processed));
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    }

    setLoading(false);
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') doSearch(); };

  const today = days ? days[0] : null;
  const cityLabel = loc
    ? loc.name + (loc.country ? ', ' + loc.country : '')
    : '—';

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="app">

      {/* Search */}
      <div className="search-row">
        <label htmlFor="cityInput">Enter city:</label>
        <input
          type="text"
          id="cityInput"
          placeholder="e.g. Solwezi"
          value={city}
          onChange={e => setCity(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button id="searchBtn" onClick={doSearch} disabled={loading}>
          {loading ? '...' : 'Search'}
        </button>
      </div>

      {/* Error */}
      {error && <div className="error-msg">{error}</div>}

      {/* Loading */}
      {loading && <div className="loading">Loading weather data…</div>}

      {/* City / Temperature / Condition */}
      {today && (
        <div className="info-box">
          <div className="city-header">{cityLabel}</div>
          <div className="info-body">
            <div className="info-row">
              Current Temperature: <span>{today.avgTemp} °C</span>
            </div>
            <div className="info-row">
              Condition: <span>{today.condition}</span>
            </div>
          </div>
        </div>
      )}

      {/* Temperature Trend Chart — Chart.js */}
      {days && (
        <div className="trend-section">
          <h2>Temperature Trend</h2>
          <hr />
          <div className="chart-wrapper">
            <canvas ref={canvasRef} id="tempChart"></canvas>
          </div>
        </div>
      )}

      {/* Insight */}
      {insight.length > 0 && (
        <div className="insight-box">
          <div className="insight-header">Insight:</div>
          <div className="insight-body">
            {insight.map((line, i) => (
              <span key={i}>{line}{i < insight.length - 1 && <br />}</span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

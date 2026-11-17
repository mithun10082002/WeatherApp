import { useCallback, useEffect, useMemo, useState } from 'react'
import CitySearch from './components/search/search.jsx'
import './App.css'

const OPENWEATHER_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY
const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY
const DEFAULT_CITY = {
  id: 'marburg',
  name: 'Marburg',
  region: 'Hessen',
  country: 'Germany',
  latitude: 50.809,
  longitude: 8.7708,
}

function getWeatherIcon(icon, description) {
  return (
    <img
      className="weather-icon"
      src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
      alt={description}
    />
  )
}

function formatDay(date) {
  return new Intl.DateTimeFormat('en', { weekday: 'short' }).format(
    new Date(`${date}T12:00:00`),
  )
}

function App() {
  const [city, setCity] = useState(DEFAULT_CITY)
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unit, setUnit] = useState('metric')

  const configured = Boolean(OPENWEATHER_KEY && RAPIDAPI_KEY)
  const degrees = unit === 'metric' ? '°' : '°'
  const unitLabel = unit === 'metric' ? 'C' : 'F'

  const loadWeather = useCallback(async (selectedCity, selectedUnit = 'metric') => {
    if (!OPENWEATHER_KEY) {
      setError('Add your OpenWeather API key to skynow/.env.local to load weather.')
      return
    }

    setLoading(true)
    setError('')
    const coordinates = `lat=${selectedCity.latitude}&lon=${selectedCity.longitude}`
    const common = `appid=${OPENWEATHER_KEY}&units=${selectedUnit}`

    try {
      const [currentResponse, forecastResponse] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?${coordinates}&${common}`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?${coordinates}&${common}`),
      ])

      if (!currentResponse.ok || !forecastResponse.ok) {
        const failedResponse = !currentResponse.ok ? currentResponse : forecastResponse
        const details = await failedResponse.json().catch(() => ({}))
        throw new Error(details.message || 'Weather data could not be loaded.')
      }

      const [current, upcoming] = await Promise.all([
        currentResponse.json(),
        forecastResponse.json(),
      ])

      const byDay = new Map()
      upcoming.list.forEach((item) => {
        const date = item.dt_txt.split(' ')[0]
        if (!byDay.has(date)) byDay.set(date, [])
        byDay.get(date).push(item)
      })

      const days = [...byDay.entries()].slice(0, 5).map(([date, items]) => {
        const midday = items.find((item) => item.dt_txt.includes('12:00:00')) || items[0]
        return {
          date,
          high: Math.round(Math.max(...items.map((item) => item.main.temp_max))),
          low: Math.round(Math.min(...items.map((item) => item.main.temp_min))),
          icon: midday.weather[0].icon,
          description: midday.weather[0].description,
        }
      })

      setCity(selectedCity)
      setWeather(current)
      setForecast(days)
    } catch (requestError) {
      setError(requestError.message || 'Something went wrong while loading weather.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!OPENWEATHER_KEY) return undefined
    const timer = window.setTimeout(() => loadWeather(DEFAULT_CITY), 0)
    return () => window.clearTimeout(timer)
  }, [loadWeather])

  const localTime = useMemo(() => {
    if (!weather) return ''
    return new Intl.DateTimeFormat('en', {
      weekday: 'long',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'UTC',
    }).format(new Date((weather.dt + weather.timezone) * 1000))
  }, [weather])

  const changeUnit = (nextUnit) => {
    if (nextUnit === unit) return
    setUnit(nextUnit)
    if (weather) loadWeather(city, nextUnit)
  }

  const temperature = weather ? Math.round(weather.main.temp) : '--'

  return (
    <main className="app-shell">
      <section className="dashboard">
        <header className="topbar">
          <div className="wordmark"><span className="wordmark-dot" />skynow<span className="wordmark-period">.</span></div>
          <CitySearch
            apiKey={RAPIDAPI_KEY}
            onSelect={(selectedCity) => loadWeather(selectedCity, unit)}
          />
          <div className="topbar-actions">
            <div className="unit-toggle" aria-label="Temperature units">
              <button
                type="button"
                className={unit === 'metric' ? 'selected' : ''}
                onClick={() => changeUnit('metric')}
                aria-pressed={unit === 'metric'}
              >°C</button>
              <button
                type="button"
                className={unit === 'imperial' ? 'selected' : ''}
                onClick={() => changeUnit('imperial')}
                aria-pressed={unit === 'imperial'}
              >°F</button>
            </div>
            <span className="topbar-label">Weather, made clear</span>
          </div>
        </header>

        {!configured && (
          <div className="setup-notice" role="status">
            Add <code>VITE_OPENWEATHER_API_KEY</code> and <code>VITE_RAPIDAPI_KEY</code> to <code>skynow/.env.local</code>, then restart the dev server.
          </div>
        )}
        {error && configured && (
          <div className="error-notice" role="alert">{error}</div>
        )}

        <div className="content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">YOUR WEATHER, AT A GLANCE</p>
              <h1>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}.</h1>
              <p className="subheading">Here&apos;s what&apos;s happening outside.</p>
            </div>
            {weather && <div className="updated-note"><span className="live-dot" /> LIVE CONDITIONS</div>}
          </div>

          <section className={`hero-card ${loading ? 'is-loading' : ''}`} aria-label="Current weather">
            <div className="hero-card-glow" />
            <div className="hero-info">
              <div className="location-line">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.3" /></svg>
                <span>{weather?.name || city.name}{city.region ? `, ${city.region}` : ''}, {city.country}</span>
              </div>
              <p className="current-date">{localTime || 'Current conditions'}</p>
              <div className="temperature-line">
                <span className="temperature">{temperature}<span className="degree-mark">{degrees}</span></span>
                <span className="unit-suffix">{unitLabel}</span>
              </div>
              <p className="condition">{weather?.weather[0].description || (loading ? 'Fetching your forecast…' : 'Weather is just a search away')}</p>
              {weather && (
                <p className="feels-like">Feels like <strong>{Math.round(weather.main.feels_like)}°{unitLabel}</strong></p>
              )}
            </div>
            <div className="hero-art" aria-hidden="true">
              {weather ? getWeatherIcon(weather.weather[0].icon, '') : (
                <div className="sun-art"><span /></div>
              )}
            </div>
            <div className="hero-footer">
              <span><span className="sunrise-icon">↗</span> Today&apos;s outlook</span>
              <span>{weather ? `H ${Math.round(weather.main.temp_max)}°  ·  L ${Math.round(weather.main.temp_min)}°` : 'Search a city to see local conditions'}</span>
            </div>
          </section>

          <section className="section-block" aria-labelledby="conditions-heading">
            <div className="section-heading">
              <div><p className="eyebrow">THE DETAILS</p><h2 id="conditions-heading">Right now</h2></div>
              <span className="section-caption">Current conditions</span>
            </div>
            <div className="details-grid">
              <article className="detail-card">
                <div className="detail-icon humidity-icon">◌</div>
                <p className="detail-label">Humidity</p>
                <p className="detail-value">{weather ? `${weather.main.humidity}%` : '--'}</p>
                <div className="detail-meter"><span style={{ width: `${weather?.main.humidity || 0}%` }} /></div>
                <p className="detail-hint">{weather ? (weather.main.humidity > 60 ? 'A little muggy' : 'Feels comfortable') : 'Waiting for data'}</p>
              </article>
              <article className="detail-card">
                <div className="detail-icon wind-icon">↗</div>
                <p className="detail-label">Wind speed</p>
                <p className="detail-value">{weather ? `${Math.round(weather.wind.speed * (unit === 'metric' ? 3.6 : 1))}` : '--'}<span className="detail-unit">{weather ? (unit === 'metric' ? ' km/h' : ' mph') : ''}</span></p>
                <p className="detail-hint">{weather ? `Direction ${weather.wind.deg}°` : 'Waiting for data'}</p>
              </article>
              <article className="detail-card">
                <div className="detail-icon visibility-icon">◎</div>
                <p className="detail-label">Visibility</p>
                <p className="detail-value">{weather ? `${(weather.visibility / 1000).toFixed(1)}` : '--'}<span className="detail-unit">{weather ? ' km' : ''}</span></p>
                <p className="detail-hint">{weather ? (weather.visibility >= 8000 ? 'Clear skies ahead' : 'Reduced visibility') : 'Waiting for data'}</p>
              </article>
              <article className="detail-card">
                <div className="detail-icon pressure-icon">⌁</div>
                <p className="detail-label">Pressure</p>
                <p className="detail-value">{weather ? weather.main.pressure : '--'}<span className="detail-unit">{weather ? ' hPa' : ''}</span></p>
                <p className="detail-hint">{weather ? 'Atmospheric pressure' : 'Waiting for data'}</p>
              </article>
            </div>
          </section>

          <section className="section-block forecast-section" aria-labelledby="forecast-heading">
            <div className="section-heading">
              <div><p className="eyebrow">PLAN AHEAD</p><h2 id="forecast-heading">5-day forecast</h2></div>
              <span className="section-caption">{city.name}</span>
            </div>
            <div className="forecast-card">
              {forecast.length ? forecast.map((day, index) => (
                <div className="forecast-row" key={day.date}>
                  <span className="forecast-day">{index === 0 ? 'Today' : formatDay(day.date)}</span>
                  {getWeatherIcon(day.icon, day.description)}
                  <span className="forecast-description">{day.description}</span>
                  <div className="forecast-range">
                    <span>{day.high}°</span>
                    <div className="range-track"><span style={{ left: `${Math.min(78, Math.max(12, 24 + (day.low + 5) * 2))}%`, width: `${Math.min(58, Math.max(22, (day.high - day.low) * 2))}%` }} /></div>
                    <span className="low-temp">{day.low}°</span>
                  </div>
                </div>
              )) : (
                <div className="forecast-empty">{loading ? 'Putting your forecast together…' : 'Your 5-day outlook will appear here.'}</div>
              )}
            </div>
          </section>
          <footer className="footer-note">Made for the days ahead <span>✳</span></footer>
        </div>
      </section>
    </main>
  )
}

export default App

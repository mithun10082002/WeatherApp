import { useEffect, useRef, useState } from 'react'

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m16 16 4 4" />
    </svg>
  )
}

function CitySearch({ apiKey, onSelect }) {
  const [query, setQuery] = useState('')
  const [cities, setCities] = useState([])
  const [message, setMessage] = useState('')
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    const searchTerm = query.trim()
    if (searchTerm.length < 2 || !apiKey) return undefined

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setSearching(true)
      setMessage('')
      try {
        const params = new URLSearchParams({
          namePrefix: searchTerm,
          limit: '6',
          sort: '-population',
        })
        const response = await fetch(`https://wft-geo-db.p.rapidapi.com/v1/geo/cities?${params}`, {
          headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': 'wft-geo-db.p.rapidapi.com',
          },
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error(response.status === 429
            ? 'City search limit reached. Try again in a moment.'
            : 'Could not search cities. Check your GeoDB API key.')
        }
        const result = await response.json()
        setCities(result.data || [])
        setMessage(result.data?.length ? '' : 'No cities found. Try another name.')
        setOpen(true)
      } catch (error) {
        if (error.name !== 'AbortError') {
          setCities([])
          setMessage(error.message || 'City search is unavailable right now.')
          setOpen(true)
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false)
      }
    }, 350)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [apiKey, query])

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!searchRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [])

  const chooseCity = (city) => {
    onSelect({
      id: city.id,
      name: city.name,
      region: city.region,
      country: city.country,
      latitude: city.latitude,
      longitude: city.longitude,
    })
    setQuery('')
    setCities([])
    setMessage('')
    setOpen(false)
  }

  return (
    <div className="search-wrap" ref={searchRef}>
      <label className="search-box">
        <SearchIcon />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setCities([])
            setMessage('')
            setSearching(false)
            setOpen(true)
          }}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          placeholder="Search any city..."
          aria-label="Search for a city"
          aria-expanded={open && query.trim().length >= 2}
          aria-controls="city-suggestions"
          autoComplete="off"
        />
        <span className="search-shortcut">CITY</span>
      </label>
      {open && query.trim().length >= 2 && (
        <div className="search-results" id="city-suggestions" role="listbox" aria-label="City suggestions">
          {searching && <p className="search-message">Searching cities…</p>}
          {!searching && !apiKey && <p className="search-message">Add your GeoDB API key to skynow/.env.local to search cities.</p>}
          {!searching && apiKey && message && <p className="search-message">{message}</p>}
          {!searching && cities.map((city) => (
            <button
              className="city-option"
              type="button"
              role="option"
              aria-selected="false"
              key={city.id}
              onClick={() => chooseCity(city)}
            >
              <span className="city-pin">⌖</span>
              <span className="city-option-copy">
                <strong>{city.city || city.name}</strong>
                <span>{[city.region, city.country].filter(Boolean).join(', ')}</span>
              </span>
              <span className="city-arrow">↗</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default CitySearch
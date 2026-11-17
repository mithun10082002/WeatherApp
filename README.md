# Skynow

Skynow is a responsive weather dashboard for checking current conditions and a five-day forecast. Search for a city to see its local weather, including temperature, humidity, wind, visibility, and pressure.

## Using Skynow

Enter a city in the search bar and choose a suggestion. Use the °C/°F switch to change temperature units.

## Built with

- React and Vite
- GeoDB Cities API via RapidAPI for city search
- OpenWeather API for current conditions and forecast
- CSS for responsive styling

## Run locally

1. Change into the app directory and install dependencies:

   ```sh
   cd skynow
   npm install
   ```

2. Create `.env.local` in `skynow` with your API keys:

   ```dotenv
   VITE_OPENWEATHER_API_KEY=your_openweather_key
   VITE_RAPIDAPI_KEY=your_rapidapi_key
   ```

3. Start the development server:

   ```sh
   npm run dev
   ```

The `.env.local` file is ignored by Git. Vite exposes `VITE_` values in browser code, so restrict these keys with their providers. For production, use a server-side proxy to keep credentials private. Build for deployment with `npm run build`.

## About the developer

The developer is a master's student at Philipps University Marburg with full-stack web development experience. Their skills include React, JavaScript, Python/Django, and SQL. Skynow was built as a practical project to apply those skills to a useful, easy-to-use weather experience.

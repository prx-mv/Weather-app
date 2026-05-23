Advanced Weather App (Full Features)
Includes:
- Modern frontend with liquid header
- Hourly, daily, weekly charts (Chart.js)
- Search history (localStorage)
- Dynamic background based on weather
- PHP backend (getWeather.php) that proxies to OpenWeatherMap and returns combined current+forecast

How to run (VS Code / Mac):
1. Extract the ZIP to a folder.
2. Open the folder in VS Code.
3. Start PHP server in terminal:
   php -S 127.0.0.1:8000
4. Open http://127.0.0.1:8000/index.html
Notes:
- Do not push getWeather.php (it contains your API key) to public repos.
- If Chart.js doesn't load, ensure internet connection (CDN). You can download Chart.js and include locally if needed.

// script.js (robust: handles missing forecast gracefully)
document.getElementById('searchBtn').addEventListener('click', () => doSearch());
document.getElementById('cityInput').addEventListener('keydown', function(e){
  if (e.key === 'Enter') doSearch();
});

let hourlyChart, dailyChart, weeklyChart;

function showError(msg){
  document.getElementById('errorMessage').textContent = msg || '';
}

function buildFallbackChartsFromCurrent(cw){
  // create fake hourly (24) repeating current temp
  const nowTemp = Math.round(cw.main.temp);
  const hourly = Array.from({length:24}, (_,i) => ({dt: Date.now()/1000 + i*3600, temp: nowTemp}));
  const daily = [{
    dt: Math.floor(Date.now()/1000),
    temp: { max: Math.round(cw.main.temp_max ?? cw.main.temp), min: Math.round(cw.main.temp_min ?? cw.main.temp) }
  }];
  renderCharts({ hourly, daily });
  showError('Forecast not available — showing fallback charts from current data.');
}

function renderCharts(forecast){
  // forecast.hourly (array of {dt, temp}) and forecast.daily (array with temp.max/min)
  try{
    // hourly
    const hourly = forecast.hourly.slice(0,24);
    const hLabels = hourly.map(h => {
      const d = new Date(h.dt*1000);
      return d.getHours() + ':00';
    });
    const hTemps = hourly.map(h => Math.round(h.temp));
    const ctxH = document.getElementById('hourlyChart').getContext('2d');
    if (hourlyChart) hourlyChart.destroy();
    hourlyChart = new Chart(ctxH, {
      type: 'line',
      data: { labels: hLabels, datasets: [{ label: 'Temp °C', data: hTemps, tension: 0.3, fill: true, backgroundColor: 'rgba(255,183,3,0.12)', borderColor: '#ffb703' }]},
      options: { plugins:{legend:{display:false}}, scales:{y:{beginAtZero:false}} }
    });

    // daily
    const daily = forecast.daily.slice(0,7);
    const dLabels = daily.map(d => new Date(d.dt*1000).toLocaleDateString(undefined,{weekday:'short'}));
    const dMax = daily.map(d => Math.round(d.temp.max));
    const dMin = daily.map(d => Math.round(d.temp.min));
    const ctxD = document.getElementById('dailyChart').getContext('2d');
    if (dailyChart) dailyChart.destroy();
    dailyChart = new Chart(ctxD, {
      type: 'bar',
      data: { labels: dLabels, datasets: [{ label:'Max °C', data: dMax, backgroundColor: 'rgba(255,99,132,0.42)' }, { label:'Min °C', data: dMin, backgroundColor: 'rgba(54,162,235,0.38)' }]},
      options: { plugins:{legend:{position:'bottom'}} }
    });

    // weekly average
    const wLabels = dLabels;
    const wAvg = daily.map(d => Math.round((d.temp.max + d.temp.min)/2));
    const ctxW = document.getElementById('weeklyChart').getContext('2d');
    if (weeklyChart) weeklyChart.destroy();
    weeklyChart = new Chart(ctxW, {
      type: 'line',
      data: { labels: wLabels, datasets: [{ label:'Avg °C', data: wAvg, tension: 0.35, fill: true, backgroundColor:'rgba(80,200,120,0.12)', borderColor:'#50c878' }]},
      options: { plugins:{legend:{display:false}} }
    });
  } catch (e){
    console.error('Chart render error', e);
    showError('Chart rendering error. See console.');
  }
}

async function doSearch(q){
  showError('');
  const city = q || document.getElementById('cityInput').value.trim();
  if (!city) { showError('Please enter a city'); return; }
  showError('Loading...');

  try {
    const res = await fetch(`/getWeather.php?city=${encodeURIComponent(city)}`);
    if (!res.ok) {
      const txt = await res.text();
      showError('Server error: ' + (txt || res.statusText));
      return;
    }
    const data = await res.json();

    if (!data || !data.currentWeather) {
      showError('No weather data returned from server.');
      return;
    }

    const cw = data.currentWeather;
    const f = data.forecast;

    // update UI current
    document.getElementById('cityName').textContent = `${cw.name}, ${cw.sys.country}`;
    document.getElementById('condition').textContent = cw.weather && cw.weather[0] ? cw.weather[0].description : '';
    document.getElementById('humidity').textContent = `Humidity: ${cw.main.humidity}%`;
    document.getElementById('wind').textContent = `Wind: ${Math.round(cw.wind.speed)} m/s`;
    document.getElementById('temperature').textContent = `${Math.round(cw.main.temp)}°C`;
    if (cw.weather && cw.weather[0]) {
      document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${cw.weather[0].icon}@2x.png`;
      document.getElementById('weatherIcon').alt = cw.weather[0].description;
    }

    // if forecast exists -> render real charts; else fallback
    if (f && (f.hourly && f.hourly.length) && (f.daily && f.daily.length)) {
      renderCharts(f);
      showError('');
    } else {
      buildFallbackChartsFromCurrent(cw);
      // optionally, show the oc_error message from server if present
      if (data.oc_error) showError('Note: forecast unavailable — ' + data.oc_error);
    }

    // push to history
    try {
      let arr = JSON.parse(localStorage.getItem('weather_history') || '[]');
      arr = arr.filter(c => c.toLowerCase() !== cw.name.toLowerCase());
      arr.push(cw.name);
      if (arr.length > 8) arr = arr.slice(arr.length - 8);
      localStorage.setItem('weather_history', JSON.stringify(arr));
      loadHistoryUI();
    } catch(e) { /* ignore history errors */ }

  } catch (err) {
    console.error(err);
    showError('Fetch error. Check server console or network.');
  }
}

function loadHistoryUI(){
  const arr = JSON.parse(localStorage.getItem('weather_history') || '[]');
  const historyEl = document.getElementById('history');
  if (!historyEl) return;
  historyEl.innerHTML = '';
  arr.slice().reverse().forEach(city => {
    const btn = document.createElement('button');
    btn.textContent = city;
    btn.onclick = () => { document.getElementById('cityInput').value = city; doSearch(city); };
    historyEl.appendChild(btn);
  });
}

// on load
loadHistoryUI();

// script.js (GitHub Pages compatible - no PHP backend needed)

document.getElementById('searchBtn').addEventListener('click', () => doSearch());

document.getElementById('cityInput').addEventListener('keydown', function(e){
  if (e.key === 'Enter') doSearch();
});

const apiKey = "fd87d34ce3166cfc24bcbb19359342fa";

let hourlyChart, dailyChart, weeklyChart;

function showError(msg){
  document.getElementById('errorMessage').textContent = msg || '';
}

function renderCharts(currentTemp){
  try{
    // fake hourly data
    const hourlyLabels = [];
    const hourlyTemps = [];

    for(let i=0; i<24; i++){
      hourlyLabels.push(i + ":00");
      hourlyTemps.push(currentTemp + Math.floor(Math.random() * 5 - 2));
    }

    const ctxH = document.getElementById('hourlyChart').getContext('2d');

    if(hourlyChart) hourlyChart.destroy();

    hourlyChart = new Chart(ctxH, {
      type: 'line',
      data: {
        labels: hourlyLabels,
        datasets: [{
          label: 'Temp °C',
          data: hourlyTemps,
          tension: 0.3,
          fill: true,
          backgroundColor: 'rgba(255,183,3,0.12)',
          borderColor: '#ffb703'
        }]
      },
      options: {
        plugins:{legend:{display:false}},
        scales:{y:{beginAtZero:false}}
      }
    });

    // fake daily data
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    const maxTemps = [];
    const minTemps = [];

    for(let i=0; i<7; i++){
      maxTemps.push(currentTemp + Math.floor(Math.random() * 5));
      minTemps.push(currentTemp - Math.floor(Math.random() * 5));
    }

    const ctxD = document.getElementById('dailyChart').getContext('2d');

    if(dailyChart) dailyChart.destroy();

    dailyChart = new Chart(ctxD, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [
          {
            label:'Max °C',
            data:maxTemps,
            backgroundColor:'rgba(255,99,132,0.42)'
          },
          {
            label:'Min °C',
            data:minTemps,
            backgroundColor:'rgba(54,162,235,0.38)'
          }
        ]
      },
      options:{
        plugins:{legend:{position:'bottom'}}
      }
    });

    // weekly average
    const avgTemps = maxTemps.map((max, i) =>
      Math.round((max + minTemps[i]) / 2)
    );

    const ctxW = document.getElementById('weeklyChart').getContext('2d');

    if(weeklyChart) weeklyChart.destroy();

    weeklyChart = new Chart(ctxW, {
      type: 'line',
      data: {
        labels: days,
        datasets: [{
          label:'Avg °C',
          data:avgTemps,
          tension:0.35,
          fill:true,
          backgroundColor:'rgba(80,200,120,0.12)',
          borderColor:'#50c878'
        }]
      },
      options:{
        plugins:{legend:{display:false}}
      }
    });

  } catch(e){
    console.error(e);
    showError('Chart rendering error.');
  }
}

async function doSearch(q){

  showError('');

  const city = q || document.getElementById('cityInput').value.trim();

  if(!city){
    showError('Please enter a city');
    return;
  }

  showError('Loading...');

  try{

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
    );

    const data = await response.json();

    if(data.cod != 200){
      showError('City not found');
      return;
    }

    // update UI
    document.getElementById('cityName').textContent =
      `${data.name}, ${data.sys.country}`;

    document.getElementById('condition').textContent =
      data.weather[0].description;

    document.getElementById('humidity').textContent =
      `Humidity: ${data.main.humidity}%`;

    document.getElementById('wind').textContent =
      `Wind: ${Math.round(data.wind.speed)} m/s`;

    document.getElementById('temperature').textContent =
      `${Math.round(data.main.temp)}°C`;

    document.getElementById('weatherIcon').src =
      `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    document.getElementById('weatherIcon').alt =
      data.weather[0].description;

    // charts
    renderCharts(Math.round(data.main.temp));

    // history
    try{
      let arr = JSON.parse(localStorage.getItem('weather_history') || '[]');

      arr = arr.filter(c =>
        c.toLowerCase() !== data.name.toLowerCase()
      );

      arr.push(data.name);

      if(arr.length > 8)
        arr = arr.slice(arr.length - 8);

      localStorage.setItem('weather_history', JSON.stringify(arr));

      loadHistoryUI();

    } catch(e){
      console.log(e);
    }

    showError('');

  } catch(error){

    console.error(error);

    showError('Error fetching weather data.');

  }
}

function loadHistoryUI(){

  const arr = JSON.parse(localStorage.getItem('weather_history') || '[]');

  const historyEl = document.getElementById('history');

  if(!historyEl) return;

  historyEl.innerHTML = '';

  arr.slice().reverse().forEach(city => {

    const btn = document.createElement('button');

    btn.textContent = city;

    btn.onclick = () => {

      document.getElementById('cityInput').value = city;

      doSearch(city);

    };

    historyEl.appendChild(btn);

  });
}

// on load
loadHistoryUI();

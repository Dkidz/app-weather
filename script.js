const apiKey = 'c6b3646f2da4466fddaace66436fd25c';
let isCelsius = true;
let map;
let marker;

// Waktu realtime
function updateTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    document.getElementById('currentTime').textContent = now.toLocaleDateString('en-US', options);
}
setInterval(updateTime, 1000);
updateTime();

// Toggle tema
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const themeToggle = document.querySelector('.theme-toggle');
    themeToggle.innerHTML = document.body.classList.contains('light-mode') ? 
        '<i class="fas fa-sun"></i>' : 
        '<i class="fas fa-moon"></i>';
}

// Toggle unit suhu
function toggleUnit() {
    isCelsius = !isCelsius;
    document.getElementById('unitToggle').textContent = isCelsius ? 'Switch to °F' : 'Switch to °C';
    getWeather();
}

// Geolocation
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            getWeatherByCoords(latitude, longitude);
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Inisialisasi peta
function initMap(lat, lon) {
    if (map) map.remove();
    map = L.map('map').setView([lat, lon], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    if (marker) map.removeLayer(marker);
    marker = L.marker([lat, lon]).addTo(map)
        .bindPopup(`Location: ${lat.toFixed(4)}, ${lon.toFixed(4)}`)
        .openPopup();
}

// Fungsi utama untuk mengambil data cuaca
async function getWeather() {
    const city = document.getElementById('cityInput').value.trim();
    if (!city) return;

    try {
        const geoResponse = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`
        );
        const geoData = await geoResponse.json();
        if (!geoData.length) throw new Error('City not found');
        const { lat, lon } = geoData[0];
        initMap(lat, lon);
        getWeatherByCoords(lat, lon);
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    }
}

async function getWeatherByCoords(lat, lon) {
    try {
        const currentResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`
        );
        const currentData = await currentResponse.json();
        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`
        );
        const forecastData = await forecastResponse.json();
        updateUI(currentData, forecastData, { name: currentData.name, country: currentData.sys.country });
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    }
}

// Fungsi-fungsi lainnya tetap sama seperti sebelumnya
function updateUI(current, forecast, location) {
    document.getElementById('cityName').textContent = `${location.name}, ${location.country}`;
    const currentWeather = current.weather[0];
    
    document.getElementById('weatherStatus').textContent = `${getWeatherStatus(currentWeather.id)} (${currentWeather.description})`;
    document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${currentWeather.icon}@4x.png`;
    
    updateTemperatures(current.main, current.wind, current.clouds, current.rain);
    
    document.getElementById('humidity').textContent = current.main.humidity;
    document.getElementById('visibility').textContent = 
    current.visibility >= 10000 ? '10+' : (current.visibility / 1000).toFixed(1);
    
    updateHourlyForecast(forecast.list);
    updateThreeDayForecast(forecast.list);
}

function getWeatherStatus(weatherId) {
    const statusMap = {
        200: 'Thunderstorm',
        201: 'Thunderstorm',
        202: 'Heavy Thunderstorm',
        210: 'Light Thunderstorm',
        211: 'Thunderstorm',
        212: 'Heavy Thunderstorm',
        221: 'Ragged Thunderstorm',
        230: 'Light Drizzle',
        231: 'Drizzle',
        232: 'Heavy Drizzle',
        300: 'Light Drizzle',
        301: 'Drizzle',
        302: 'Heavy Drizzle',
        310: 'Light Rain',
        311: 'Rain',
        312: 'Heavy Rain',
        313: 'Shower Rain',
        314: 'Heavy Shower Rain',
        321: 'Shower Drizzle',
        500: 'Light Rain',
        501: 'Moderate Rain',
        502: 'Heavy Rain',
        503: 'Very Heavy Rain',
        504: 'Extreme Rain',
        511: 'Freezing Rain',
        520: 'Light Shower Rain',
        521: 'Shower Rain',
        522: 'Heavy Shower Rain',
        531: 'Ragged Shower Rain',
        600: 'Light Snow',
        601: 'Snow',
        602: 'Heavy Snow',
        611: 'Sleet',
        612: 'Light Sleet',
        613: 'Sleet',
        615: 'Light Rain/Snow',
        616: 'Rain/Snow',
        620: 'Light Snow Showers',
        621: 'Snow Showers',
        622: 'Heavy Snow Showers',
        701: 'Mist',
        711: 'Smoke',
        721: 'Haze',
        731: 'Sand/Dust Whirls',
        741: 'Fog',
        751: 'Sand',
        761: 'Dust',
        762: 'Volcanic Ash',
        771: 'Squalls',
        781: 'Tornado',
        800: 'Clear',
        801: 'Few Clouds',
        802: 'Scattered Clouds',
        803: 'Broken Clouds',
        804: 'Overcast'
    };

    return statusMap[weatherId] || 'N/A';
}

function updateTemperatures(mainData, windData, cloudData, rainData) {
    const convertTemp = (kelvin) => 
        isCelsius ? 
        (kelvin - 273.15).toFixed(1) : 
        ((kelvin - 273.15) * 9/5 + 32).toFixed(1);

    document.getElementById('pressure').textContent = mainData.pressure;
    document.getElementById('seaLevel').textContent = mainData.sea_level || 'N/A';
    document.getElementById('grndLevel').textContent = mainData.grnd_level || 'N/A';
    document.getElementById('windSpeed').textContent = windData.speed;
    document.getElementById('windDeg').textContent = windData.deg || 'N/A';
    document.getElementById('windGust').textContent = windData.gust || 'N/A';
    document.getElementById('clouds').textContent = cloudData.all;
    document.getElementById('rain').textContent = rainData?.['1h'] || '0';
    document.getElementById('temp').textContent = convertTemp(mainData.temp);
    document.getElementById('feelsLike').textContent = convertTemp(mainData.feels_like);
    document.getElementById('tempHigh').textContent = convertTemp(mainData.temp_max);
    document.getElementById('tempLow').textContent = convertTemp(mainData.temp_min);
    document.getElementById('tempAvg').textContent = convertTemp((mainData.temp_max + mainData.temp_min) / 2);

    // Update semua unit
    const units = document.querySelectorAll('.unit');
    units.forEach(unit => {
        unit.textContent = isCelsius ? '°C' : '°F';
    });

    // Update unit utama
    document.getElementById('unit').textContent = isCelsius ? '°C' : '°F';
}


function updateHourlyForecast(forecastList) {
    const container = document.getElementById('hourlyForecast');
    container.innerHTML = '';
    
    forecastList.slice(0, 8).forEach(item => { // Next 24 hours (3-hour intervals)
        const date = new Date(item.dt * 1000);
        const card = document.createElement('div');
        card.className = 'forecast-card';
        
        card.innerHTML = `
            <p>${date.getHours()}:00</p>
            <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png">
            <p>${getWeatherStatus(item.weather[0].id)}</p>
            <p class="highlight">${isCelsius ? 
                (item.main.temp - 273.15).toFixed(1) + '°C' : 
                ((item.main.temp - 273.15) * 9/5 + 32).toFixed(1) + '°F'}
            </p>
            <p>Humidity: ${item.main.humidity}%</p>
        `;
        
        container.appendChild(card);
    });
}

function updateThreeDayForecast(forecastList) {
    const container = document.getElementById('threeDayForecast');
    container.innerHTML = '';
    
    // Group by day
    const dailyForecast = {};
    forecastList.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toLocaleDateString('en-US', { weekday: 'long' });
        
        if (!dailyForecast[dayKey]) {
            dailyForecast[dayKey] = {
                temps: [],
                weather: [],
                date: date
            };
        }
        
        dailyForecast[dayKey].temps.push(item.main.temp);
        dailyForecast[dayKey].weather.push(item.weather[0]);
    });
    
    // Get next 3 days
    const nextDays = Object.entries(dailyForecast).slice(1, 4);
    
    nextDays.forEach(([dayName, data]) => {
        const maxTemp = Math.max(...data.temps);
        const minTemp = Math.min(...data.temps);
        const avgTemp = (maxTemp + minTemp) / 2;
        
        const card = document.createElement('div');
        card.className = 'forecast-card';
        
        card.innerHTML = `
            <p>${dayName}</p>
            <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}.png">
            <p>${getWeatherStatus(data.weather[0].id)}</p>
            <p>High: <span class="highlight">${isCelsius ? 
                (maxTemp - 273.15).toFixed(1) + '°C' : 
                ((maxTemp - 273.15) * 9/5 + 32).toFixed(1) + '°F'}</span></p>
            <p>Low: <span class="highlight">${isCelsius ? 
                (minTemp - 273.15).toFixed(1) + '°C' : 
                ((minTemp - 273.15) * 9/5 + 32).toFixed(1) + '°F'}</span></p>
        `;
        
        container.appendChild(card);
    });
}

function showError(message) {
    // Implement error display logic
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    document.querySelector('.container').appendChild(errorDiv);
}
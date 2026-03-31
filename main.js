const API_KEY = "5e928c6a2601dc422b8d01c7310fe680";

// Elements
const form = document.getElementById("searchform");
const cityInput = document.getElementById("cityInput");
const autoBtn = document.getElementById("autoBtn");
const loading = document.getElementById("loading");
const errorDiv = document.getElementById("error");
const weatherContent = document.getElementById("weatherContent");

// Display Elements
const cityNameEl = document.getElementById("cityName");
const dateLabelEl = document.getElementById("dateLabel");
const tempEl = document.getElementById("temp");
const descEl = document.getElementById("description");
const detailsEl = document.getElementById("details");
const mainIconEl = document.getElementById("mainIcon");

const hourlyContainer = document.getElementById("hourlyContainer");
const forecastCards = document.getElementById("forecastCards");

// Helpers
function showUI(isLoading, isError = false, message = "") {
    loading.classList.toggle("hidden", !isLoading);
    errorDiv.classList.toggle("hidden", !isError);
    if (isError) errorDiv.textContent = message;
    if (isLoading || isError) weatherContent.classList.add("hidden");
}

// Logic: Fetching using the FREE 5-Day / 3-Hour API
async function getWeather(lat, lon, cityName, country) {
    showUI(true);
    try {
        // We use the 2.5/forecast endpoint which is free for everyone
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.cod !== "200") throw new Error(data.message);

        // 1. Update Main Display with the very first item (Current)
        const current = data.list[0];
        updateMain(current, cityName, country, "Current Weather");

        // 2. Render Hourly (Next 48 Hours)
        // Note: The free API gives data in 3-hour chunks.
        hourlyContainer.innerHTML = "";
        data.list.slice(0, 16).forEach(item => { // 16 items * 3 hours = 48 hours
            const time = new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const div = document.createElement("div");
            div.className = "hour-card";
            div.innerHTML = `
                <p>${time}</p>
                <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png">
                <p>${Math.round(item.main.temp)}°</p>
            `;
            hourlyContainer.appendChild(div);
        });

        // 3. Render Daily (Filtering to 1 entry per day)
        forecastCards.innerHTML = "";
        // We filter the list to only show the weather at 12:00 PM for each day
        const dailyData = data.list.filter(item => item.dt_txt.includes("12:00:00"));

        dailyData.forEach((day, index) => {
            const dateObj = new Date(day.dt * 1000);
            const dayName = index === 0 ? "Today" : dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
            
            const div = document.createElement("div");
            div.className = "daily-row";
            div.innerHTML = `
                <span class="day-name">${dayName}</span>
                <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png">
                <span>${Math.round(day.main.temp_max)}° / ${Math.round(day.main.temp_min)}°</span>
            `;
            
            div.onclick = () => {
                updateMain(day, cityName, country, dayName);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
            
            forecastCards.appendChild(div);
        });

        weatherContent.classList.remove("hidden");
        showUI(false);
    } catch (err) {
        showUI(false, true, "Could not load forecast: " + err.message);
    }
}

function updateMain(data, city, country, label) {
    cityNameEl.textContent = `${city}, ${country}`;
    dateLabelEl.textContent = label;
    tempEl.textContent = `${Math.round(data.main.temp)}°C`;
    descEl.textContent = data.weather[0].description;
    mainIconEl.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    detailsEl.textContent = `Humidity: ${data.main.humidity}% | Wind: ${data.wind.speed} m/s`;
}

// Events
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const city = cityInput.value.trim();
    showUI(true);
    try {
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`);
        const geoData = await geoRes.json();
        if (!geoData.length) throw new Error("City not found");
        getWeather(geoData[0].lat, geoData[0].lon, geoData[0].name, geoData[0].country);
    } catch (err) { showUI(false, true, err.message); }
});

autoBtn.addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition(pos => {
        getWeather(pos.coords.latitude, pos.coords.longitude, "Your Location", "");
    }, () => showUI(false, true, "Location access denied"));
});

// Default Load (Nairobi)
getWeather(-1.286389, 36.817223, "Nairobi", "KE");

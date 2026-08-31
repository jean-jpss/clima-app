"use strict";

/**
 * ClimaAgora
 * Consome a API pública Open-Meteo (https://open-meteo.com/) para geocodificação
 * e previsão do tempo, e a BigDataCloud (reverse geocoding) para nomear a
 * localização quando o usuário usa geolocalização do navegador.
 * Sem necessidade de chave de API.
 */

// ---------------------------------------------------------------------------
// Elementos da página
// ---------------------------------------------------------------------------
const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const geoBtn = document.getElementById("geo-btn");
const statusMsg = document.getElementById("status-msg");
const themeToggle = document.getElementById("theme-toggle");

const emptyState = document.getElementById("empty-state");
const currentSection = document.getElementById("current-weather");
const forecastSection = document.getElementById("forecast");
const forecastList = document.getElementById("forecast-list");

const cityNameEl = document.getElementById("cidade-atual");
const currentDateEl = document.getElementById("current-date");
const currentIconEl = document.getElementById("current-icon");
const tempNowEl = document.getElementById("temp-now");
const conditionTextEl = document.getElementById("condition-text");
const feelsLikeEl = document.getElementById("feels-like");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const precipEl = document.getElementById("precip");

// ---------------------------------------------------------------------------
// Mapa de códigos de tempo (padrão WMO usado pela Open-Meteo)
// ---------------------------------------------------------------------------
const WEATHER_CODES = {
  0: { desc: "Céu limpo", icon: "☀️" },
  1: { desc: "Predominantemente limpo", icon: "🌤️" },
  2: { desc: "Parcialmente nublado", icon: "⛅" },
  3: { desc: "Nublado", icon: "☁️" },
  45: { desc: "Neblina", icon: "🌫️" },
  48: { desc: "Neblina com geada", icon: "🌫️" },
  51: { desc: "Garoa fraca", icon: "🌦️" },
  53: { desc: "Garoa moderada", icon: "🌦️" },
  55: { desc: "Garoa intensa", icon: "🌧️" },
  56: { desc: "Garoa congelante fraca", icon: "🌧️" },
  57: { desc: "Garoa congelante intensa", icon: "🌧️" },
  61: { desc: "Chuva fraca", icon: "🌦️" },
  63: { desc: "Chuva moderada", icon: "🌧️" },
  65: { desc: "Chuva forte", icon: "🌧️" },
  66: { desc: "Chuva congelante fraca", icon: "🌧️" },
  67: { desc: "Chuva congelante forte", icon: "🌧️" },
  71: { desc: "Neve fraca", icon: "🌨️" },
  73: { desc: "Neve moderada", icon: "🌨️" },
  75: { desc: "Neve forte", icon: "❄️" },
  77: { desc: "Grãos de neve", icon: "❄️" },
  80: { desc: "Pancadas de chuva fracas", icon: "🌦️" },
  81: { desc: "Pancadas de chuva moderadas", icon: "🌧️" },
  82: { desc: "Pancadas de chuva violentas", icon: "⛈️" },
  85: { desc: "Pancadas de neve fracas", icon: "🌨️" },
  86: { desc: "Pancadas de neve fortes", icon: "❄️" },
  95: { desc: "Trovoada", icon: "⛈️" },
  96: { desc: "Trovoada com granizo fraco", icon: "⛈️" },
  99: { desc: "Trovoada com granizo forte", icon: "⛈️" },
};

function getWeatherInfo(code) {
  return WEATHER_CODES[code] || { desc: "Condição desconhecida", icon: "🌡️" };
}

// ---------------------------------------------------------------------------
// Utilitários de UI
// ---------------------------------------------------------------------------
function setStatus(message, state) {
  statusMsg.textContent = message || "";
  if (state) {
    statusMsg.setAttribute("data-state", state);
  } else {
    statusMsg.removeAttribute("data-state");
  }
}

function setLoading(isLoading) {
  cityInput.disabled = isLoading;
  geoBtn.disabled = isLoading;
  searchForm.querySelector("button[type=submit]").disabled = isLoading;
}

function showResults() {
  emptyState.hidden = true;
  currentSection.hidden = false;
  forecastSection.hidden = false;
}

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
const FULL_DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function renderCurrentWeather(place, current) {
  const info = getWeatherInfo(current.weather_code);

  cityNameEl.textContent = place;
  currentDateEl.textContent = FULL_DATE_FORMATTER.format(new Date());
  currentIconEl.textContent = info.icon;
  tempNowEl.textContent = Math.round(current.temperature_2m);
  conditionTextEl.textContent = info.desc;
  feelsLikeEl.textContent = `${Math.round(current.apparent_temperature)}°C`;
  humidityEl.textContent = `${Math.round(current.relative_humidity_2m)}%`;
  windEl.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  precipEl.textContent = `${Math.round(current.precipitation ?? 0)} mm`;
}

function renderForecast(daily) {
  forecastList.innerHTML = "";

  // O índice 0 é o dia atual; mostramos os próximos 5 dias.
  for (let i = 1; i < daily.time.length && i <= 5; i++) {
    const date = new Date(`${daily.time[i]}T00:00:00`);
    const info = getWeatherInfo(daily.weather_code[i]);
    const max = Math.round(daily.temperature_2m_max[i]);
    const min = Math.round(daily.temperature_2m_min[i]);

    const li = document.createElement("li");
    li.className = "forecast-day";
    li.innerHTML = `
      <p class="day-label">${WEEKDAY_FORMATTER.format(date)}</p>
      <p class="day-icon" aria-hidden="true">${info.icon}</p>
      <p class="visually-hidden">${info.desc}</p>
      <p class="day-temps"><strong>${max}°</strong> / ${min}°</p>
    `;
    forecastList.appendChild(li);
  }
}

// ---------------------------------------------------------------------------
// Chamadas de API
// ---------------------------------------------------------------------------
async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erro na requisição (HTTP ${response.status})`);
  }
  return response.json();
}

async function geocodeCity(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    name
  )}&count=1&language=pt&format=json`;
  const data = await fetchJSON(url);
  if (!data.results || data.results.length === 0) {
    return null;
  }
  const result = data.results[0];
  const parts = [result.name, result.admin1, result.country].filter(Boolean);
  return {
    label: [...new Set(parts)].join(", "),
    latitude: result.latitude,
    longitude: result.longitude,
  };
}

async function reverseGeocode(latitude, longitude) {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`;
    const data = await fetchJSON(url);
    const parts = [data.city || data.locality, data.principalSubdivision, data.countryName].filter(
      Boolean
    );
    return [...new Set(parts)].join(", ") || "Sua localização atual";
  } catch (err) {
    return "Sua localização atual";
  }
}

async function fetchForecast(latitude, longitude) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&timezone=auto&forecast_days=6`;
  return fetchJSON(url);
}

async function loadWeatherForPlace(label, latitude, longitude) {
  setLoading(true);
  setStatus("Carregando previsão do tempo...", "loading");
  try {
    const forecast = await fetchForecast(latitude, longitude);
    renderCurrentWeather(label, forecast.current);
    renderForecast(forecast.daily);
    showResults();
    setStatus("");
  } catch (err) {
    setStatus(
      "Não foi possível obter os dados do clima agora. Verifique sua conexão e tente novamente.",
      "error"
    );
  } finally {
    setLoading(false);
  }
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------
async function handleSearch(event) {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (!city) {
    setStatus("Digite o nome de uma cidade para buscar.", "error");
    return;
  }

  setLoading(true);
  setStatus(`Buscando "${city}"...`, "loading");

  try {
    const place = await geocodeCity(city);
    if (!place) {
      setStatus("Cidade não encontrada. Verifique o nome e tente novamente.", "error");
      setLoading(false);
      return;
    }
    await loadWeatherForPlace(place.label, place.latitude, place.longitude);
  } catch (err) {
    setStatus(
      "Não foi possível buscar essa cidade agora. Verifique sua conexão e tente novamente.",
      "error"
    );
    setLoading(false);
  }
}

function handleGeolocation() {
  if (!("geolocation" in navigator)) {
    setStatus("Seu navegador não oferece suporte a geolocalização.", "error");
    return;
  }

  setLoading(true);
  setStatus("Obtendo sua localização...", "loading");

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      const label = await reverseGeocode(latitude, longitude);
      await loadWeatherForPlace(label, latitude, longitude);
    },
    (error) => {
      setLoading(false);
      const message =
        error.code === error.PERMISSION_DENIED
          ? "Permissão de localização negada. Você pode buscar uma cidade manualmente."
          : "Não foi possível obter sua localização. Tente buscar uma cidade manualmente.";
      setStatus(message, "error");
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
  );
}

function handleThemeToggle() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const next = isDark ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  themeToggle.setAttribute("aria-pressed", String(next === "dark"));
  themeToggle.setAttribute(
    "aria-label",
    next === "dark" ? "Alternar para tema claro" : "Alternar para tema escuro"
  );
  themeToggle.querySelector("span").textContent = next === "dark" ? "☀️" : "🌙";
}

// ---------------------------------------------------------------------------
// Inicialização
// ---------------------------------------------------------------------------
searchForm.addEventListener("submit", handleSearch);
geoBtn.addEventListener("click", handleGeolocation);
themeToggle.addEventListener("click", handleThemeToggle);

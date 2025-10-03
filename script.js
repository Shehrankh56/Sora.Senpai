class WeatherApp {
  constructor() {
    this.API_KEY = 'Add your key here'; 
    this.BASE_URL = 'https://api.openweathermap.org/data/2.5';
    this.lastSearchedCity = '';
    
    this.initializeElements();
    this.bindEvents();
    this.loadLastSearchedCity();
  }

  initializeElements() {
    // Form elements
    this.searchForm = document.getElementById('search-form');
    this.cityInput = document.getElementById('city-input');
    this.searchBtn = document.getElementById('search-btn');
    this.btnText = this.searchBtn.querySelector('.btn-text');
    this.loadingSpinner = this.searchBtn.querySelector('.loading-spinner');

    // Display elements
    this.weatherDisplay = document.getElementById('weather-display');
    this.errorDisplay = document.getElementById('error-display');
    this.quickCities = document.getElementById('quick-cities');
    this.initialMessage = document.getElementById('initial-message');

    // Weather data elements
    this.locationName = document.getElementById('location-name');
    this.weatherDescription = document.getElementById('weather-description');
    this.weatherEmoji = document.getElementById('weather-emoji');
    this.temperature = document.getElementById('temperature');
    this.feelsLike = document.getElementById('feels-like');
    this.humidity = document.getElementById('humidity');
    this.windSpeed = document.getElementById('wind-speed');
    this.condition = document.getElementById('condition');

    // Error elements
    this.errorMessage = document.getElementById('error-message');
    this.retryBtn = document.getElementById('retry-btn');

    // Toast
    this.toast = document.getElementById('toast');
    this.toastMessage = document.getElementById('toast-message');
  }

  bindEvents() {
    // Search form submission
    this.searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSearch();
    });

    // Quick city buttons
    document.querySelectorAll('.city-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const city = btn.getAttribute('data-city');
        this.cityInput.value = city;
        this.handleSearch();
      });
    });

    // Retry button
    this.retryBtn.addEventListener('click', () => {
      if (this.lastSearchedCity) {
        this.cityInput.value = this.lastSearchedCity;
        this.handleSearch();
      }
    });
  }

  loadLastSearchedCity() {
    const savedCity = localStorage.getItem('lastSearchedCity');
    if (savedCity) {
      this.lastSearchedCity = savedCity;
      this.cityInput.value = savedCity;
      this.searchWeather(savedCity);
    }
  }

  async handleSearch() {
    const city = this.cityInput.value.trim();
    if (!city) return;

    await this.searchWeather(city);
  }

  async searchWeather(city) {
    this.setLoadingState(true);
    this.hideAllDisplays();

    try {
      const weatherData = await this.fetchWeatherData(city);
      this.displayWeather(weatherData);
      this.saveLastSearchedCity(city);
      this.showToast(`Weather updated for ${weatherData.name}, ${weatherData.country}`);
    } catch (error) {
      this.displayError(error.message);
      this.showToast(error.message, 'error');
    } finally {
      this.setLoadingState(false);
    }
  }

  async fetchWeatherData(city) {
    const url = `${this.BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${this.API_KEY}&units=metric`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('City not found. Please check the spelling and try again.');
        } else if (response.status === 401) {
          throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
        }
        throw new Error(`Weather service error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        name: data.name,
        country: data.sys.country,
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        feelsLike: Math.round(data.main.feels_like),
        icon: data.weather[0].icon
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch weather data. Please check your internet connection.');
    }
  }

  displayWeather(weather) {
    // Update weather information
    this.locationName.textContent = `${weather.name}, ${weather.country}`;
    this.weatherDescription.textContent = weather.description;
    this.weatherEmoji.textContent = this.getWeatherEmoji(weather.condition);
    this.temperature.textContent = `${weather.temperature}°`;
    this.feelsLike.textContent = `Feels like ${weather.feelsLike}°C`;
    this.humidity.textContent = `${weather.humidity}%`;
    this.windSpeed.textContent = `${weather.windSpeed} km/h`;
    this.condition.textContent = weather.condition;

    // Show weather display
    this.weatherDisplay.classList.remove('hidden');
  }

  displayError(message) {
    this.errorMessage.textContent = message;
    this.errorDisplay.classList.remove('hidden');
    
    // Show retry button if we have a last searched city
    if (this.lastSearchedCity) {
      this.retryBtn.classList.remove('hidden');
    }
  }

  setLoadingState(loading) {
    if (loading) {
      this.searchBtn.disabled = true;
      this.btnText.classList.add('hidden');
      this.loadingSpinner.classList.remove('hidden');
    } else {
      this.searchBtn.disabled = false;
      this.btnText.classList.remove('hidden');
      this.loadingSpinner.classList.add('hidden');
    }
  }

  hideAllDisplays() {
    this.weatherDisplay.classList.add('hidden');
    this.errorDisplay.classList.add('hidden');
    this.quickCities.classList.add('hidden');
    this.initialMessage.classList.add('hidden');
    this.retryBtn.classList.add('hidden');
  }

  saveLastSearchedCity(city) {
    this.lastSearchedCity = city;
    localStorage.setItem('lastSearchedCity', city);
  }

  getWeatherEmoji(condition) {
    const conditionMap = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️'
    };
    
    return conditionMap[condition] || '🌤️';
  }

  showToast(message, type = 'success') {
    this.toastMessage.textContent = message;
    this.toast.classList.remove('hidden');
    
    // Change toast color based on type
    if (type === 'error') {
      this.toast.style.borderColor = 'hsl(0, 84%, 60%)';
      this.toast.querySelector('.toast-icon').style.color = 'hsl(0, 84%, 60%)';
    } else {
      this.toast.style.borderColor = 'hsl(200, 30%, 85%)';
      this.toast.querySelector('.toast-icon').style.color = 'hsl(200, 95%, 60%)';
    }
    
    // Auto hide after 4 seconds
    setTimeout(() => {
      this.hideToast();
    }, 4000);
  }

  hideToast() {
    this.toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      this.toast.classList.add('hidden');
      this.toast.style.animation = '';
    }, 300);
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new WeatherApp();
});

// Show quick cities and initial message on first load
window.addEventListener('load', () => {
  const savedCity = localStorage.getItem('lastSearchedCity');
  if (!savedCity) {
    document.getElementById('quick-cities').classList.remove('hidden');
    document.getElementById('initial-message').classList.remove('hidden');
  }
});
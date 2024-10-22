// Fetching data
const LOCATIONIQ_API_TOKEN = "pk.b073dee4593f796139c0d65aa6b34ac4";

const getLocationList = async (location) => {
  try {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${location}&count=5&language=en&format=json`)
    const { results } = await response.json()
    results ? showLocationList(results) : showNotResults()
  } catch (error) {
    console.log(error)
  }
}

const getLocationName = async ({latitude, longitude}) => {
  try {
    const response = await fetch(`https://us1.locationiq.com/v1/reverse?key=${LOCATIONIQ_API_TOKEN}&lat=${latitude}&lon=${longitude}&format=json&zoom=8&addressdetails=1&statecode=1`)
    
    const { address } = await response.json()
    showLocationInfo({ name: address.county, admin1: address.state, country: address.country, country_code: address.country_code })
    getWeather({ latitude, longitude })

    setLocationWeather({ name: address.county, admin1: address.state, country: address.country, country_code: address.country_code, latitude, longitude })
  } catch (error) {
    console.log(error)
  }
}

const getWeather = async ({latitude, longitude, timezone = "America/New_York" }) => {
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain&daily=temperature_2m_max,temperature_2m_min&timezone=${timezone}`)
    
    const data = await response.json()
    delete data.latitude
    delete data.longitude
    showWeatherInfo(data)
    updateLocalStorage({latitude, longitude, ...data})
    showAllLocationWeather()
  } catch (error) {
    console.log(error)
  }
}

// Work with DOM
const listContainer = document.getElementById('listContainer');
const wrapResults = document.querySelector('.wrap-results');
const searchForm = document.getElementById('searchLocationForm');

const locationWeather = document.getElementById('locationWeather');
const timeWeather = document.getElementById('timeWeather');
const currentWeather = document.getElementById('currentWeather');
const forecastWeather = document.getElementById('forecastWeather');
const additionalInfo = document.getElementById('additionalInfo');

const showNotResults = () => {
  listContainer.innerHTML = "<p class='no-result'>No Results</p>";
  wrapResults.classList.add('open')
}

const showLocationList = (locations) => {
  listContainer.innerHTML = '';
  
  for(const location of locations) {
    listContainer.innerHTML += `
      <li data-location='${JSON.stringify(location)}'>
        <img 
          src="https://www.worldatlas.com/r/w236/img/flag/${location.country_code.toLowerCase()}-flag.jpg" 
          onerror="this.onerror=null; this.src='/assets/default-flag.webp'">
          alt="${location.country} Flag"
        <div>
          <p>${location.name}<p>
          <p>${location.admin1 || location.admin2}<p>
        </div>
      </li>
    `;
  }

  listContainer.querySelectorAll('#listContainer > li').forEach(item => item.addEventListener('click', () => selectLocation(item)))

  wrapResults.classList.add('open')
}

const showWeatherInfo = ({current, current_units, daily, daily_units, ...rest}) => {
  const newTime = new Date(current.time).toLocaleString("en-US", { timeStyle: "short", hour12: false})
  
  timeWeather.innerHTML = `Weather time: ${newTime} (${rest.timezone_abbreviation})`

  currentWeather.innerHTML = `
    <span>${current.temperature_2m}${current_units.temperature_2m}</span>
    <p>Real Feel <span>${current.apparent_temperature}${current_units.apparent_temperature}</span></p
  `

  additionalInfo.innerHTML = `
    <h3>Precipitation</h3>
    <p>${current.precipitation} ${current_units.precipitation}</p>
    <h3>Rain</h3>
    <p>${current.rain} ${current_units.rain}</p>
    <h3>Humidity</h3>
    <p>${current.relative_humidity_2m} ${current_units.relative_humidity_2m}</p>
  `;

  forecastWeather.innerHTML = ''
  daily.temperature_2m_max.map((temp, i) => {
    forecastWeather.innerHTML += `
      <article>
        <h3>
          ${new Intl.DateTimeFormat('en-VE', {weekday: 'short'}).format(new Date(daily.time[i]))}
          ${daily.time[i].slice(-2)}
        </h3>        
        <span>${temp+daily_units.temperature_2m_max}</span>
        <span>${daily.temperature_2m_min[i]+daily_units.temperature_2m_max}</span>
      </article>
    `;
  })

}

const showLocationInfo = (location) => {
  locationWeather.innerHTML = `
  <img src="https://www.worldatlas.com/r/w236/img/flag/${location.country_code.toLowerCase()}-flag.jpg" onerror="this.onerror=null; this.src='/assets/default-flag.webp'" alt="${location.country} Flag">
  <p>${location.name}, ${location.admin1 || location.admin2}, ${location.country}</p>
  `
}

// Events
searchForm.addEventListener('submit', e => {
  e.preventDefault()
  let location = e.target.location.value
  getLocationList(location)
})

const selectLocation = (element) => {
  const dataLocation = JSON.parse(element.dataset.location)
  showLocationInfo(dataLocation)
  getWeather(dataLocation)
  setLocationWeather(dataLocation)
  showAllLocationWeather()
}

// Geolocation API
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => { 
      getLocationName({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      })
    });
  } else {
    console.log("Geolocation is not supported by this browser.");
  }
}

getLocation()

// LocalStorage
const setLocationWeather = (info) => {
  const weatherData = getLocationWeather() || []
  const weatherLength = weatherData.length

  const newData = [...weatherData, {...info, id: weatherLength+1}]

  localStorage.setItem("indexWeather", JSON.stringify(newData))
}

const updateLocalStorage = (info) => {
  const weatherData = getLocationWeather()
  const weatherLength = weatherData.length
  tempInfo = {...weatherData[weatherLength-1], ...info}

  weatherData[weatherLength-1] = tempInfo

  localStorage.setItem("indexWeather", JSON.stringify(weatherData))
}

const deleteLocalStorage = (e, id) => {
  let rowList = e.closest('tr')
  rowList.remove()
  let weatherData = getLocationWeather()
  weatherData = weatherData.filter(weather => weather.id !== id);
  localStorage.setItem("indexWeather", JSON.stringify(weatherData))
  showAllLocationWeather()
}

const getLocationWeather = () => {
  const data = JSON.parse(localStorage.getItem(`indexWeather`))
  return data
}

const showLocationWeather= (id) => {
  const weatherData = getLocationWeather()
  const weatherInfo = weatherData.filter(weather => weather.id === id);
  showWeatherInfo(...weatherInfo)
  showLocationInfo(...weatherInfo)
}

const showAllLocationWeather = () => {
  const weatherData = getLocationWeather() || []
  const weatherList = document.getElementById('listWeather')
  weatherList.innerHTML = "";
  weatherData.map(weather => {
    const newTime = new Date(weather.current.time).toLocaleString("en-US", { timeStyle: "short", hour12: false})

    weatherList.innerHTML += `
    <tr>
      <td>
      <div class="location-info">
        <img src="https://www.worldatlas.com/r/w236/img/flag/${weather.country_code.toLowerCase()}-flag.jpg" onerror="this.onerror=null; this.src='/assets/default-flag.webp '"  alt="${weather.country} Flag">
        <div>
        <p>${weather.name}<p>
        <p>${weather.admin1 || weather.admin2}<p>
        </div>
      </div>
      </td>
      <td>
        ${weather.current.temperature_2m}${weather.current_units.temperature_2m}
      </td>
      <td>
        ${newTime} (${weather.timezone_abbreviation})
      </td>
      <td>
        <button class="btn btn-show" onclick="showLocationWeather(${weather.id})">Show</button>
        <button class="btn btn-delete" onclick="deleteLocalStorage(this, ${weather.id})">Delete</button>
      </td>
    </tr>`
  })
}

window.addEventListener("storage", () => {
  showAllLocationWeather()
})
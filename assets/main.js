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

    setLocalStorage({ name: address.county, admin1: address.state, country: address.country, country_code: address.country_code, latitude, longitude })
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
          src="https://www.worldometers.info/img/flags/${location.country_code.toLowerCase()}-flag.gif" 
          onerror="this.onerror=null; this.src='/assets/default-flag.png'">
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

const showWeatherInfo = ({current, current_units, ...rest}) => {
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
}

const showLocationInfo = (location) => {
  locationWeather.innerHTML = `
  <img src="https://www.worldometers.info/img/flags/${location.country_code.toLowerCase()}-flag.gif" onerror="this.onerror=null; this.src='/assets/default-flag.png'">
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

  setLocalStorage(dataLocation)
}

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
const setLocalStorage = (info) => {
  localStorage.setItem(`${info.latitude.toFixed(2)}+${info.longitude.toFixed(2)}`, JSON.stringify(info))
}

const updateLocalStorage = (info) => {
  let tempInfo = JSON.parse(localStorage.getItem(`${info.latitude.toFixed(2)}+${info.longitude.toFixed(2)}`))
  tempInfo = {...tempInfo, ...info}
  localStorage.setItem(`${info.latitude.toFixed(2)}+${info.longitude.toFixed(2)}`, JSON.stringify(tempInfo))
}

const showLocalStorage = () => {
  Object.keys(localStorage).forEach(key => [
    console.log(localStorage.getItem(key))
  ])
}

showLocalStorage()
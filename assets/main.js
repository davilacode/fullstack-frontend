// Fetching data
const getLocationList = async (location) => {
  try {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${location}&count=5&language=en&format=json`)
    const { results } = await response.json()
    results ? showLocationList(results) : showNotResults()
  } catch (error) {
    console.log(error)
  }
}

const getWeather = async ({latitude, longitude}) => {
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,rain&daily=temperature_2m_max,temperature_2m_min&timezone=America%2FNew_York`)
    const { results } = await response.json()
    console.log(results)
  } catch (error) {
    console.log(error)
  }
}

// Work with DOM
let listContainer = document.getElementById('listContainer');
let wrapResults = document.querySelector('.wrap-results');
let searchForm = document.getElementById('searchLocationForm');

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
// TODO: Show data from getWeather

const selectLocation = (element) => {
  const dataLocation = JSON.parse(element.dataset.location)
  getWeather(dataLocation)
}


// Events
searchForm.addEventListener('submit', e => {
  e.preventDefault()
  let location = e.target.location.value
  getLocationList(location)
})



function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => console.log(position));
  } else {
    console.log("Geolocation is not supported by this browser.");
  }
}

getLocation()
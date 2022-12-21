const urlParams = new URLSearchParams(window.location.search);
const account = urlParams.get('account');
const iconURL = 'https://openweathermap.org/img/wn/';
const moonURL = '/api/moon';

function getLocation() {
  function success(position) {
    currentWeatherHTML(position);
    weatherForecastHTML(position);
  }

  function error() {
    let position = { coords: {} };
    position['coords']['latitude'] = 40.7128;
    position['coords']['longitude'] = -74.006;
    currentWeatherHTML(position);
    weatherForecastHTML(position);
  }
  navigator.geolocation.getCurrentPosition(success, error);
}

async function getData(url) {
  const data = await fetch(url).then((res) => res.json());
  return data;
}

function createDateComponents(dateNum, utc) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  if (utc) {
    const offset = new Date().getTimezoneOffset();
    dateNum = dateNum + offset * 60;
  }
  const date = new Date(dateNum * 1000);
  const month = months[date.getMonth()];
  const dayOfTheWeek = days[date.getDay()];
  const day = date.getDate();
  const hour = date.getHours();
  const mins = date.getMinutes().toString().padStart(2, '0');
  return { dayOfTheWeek, month, day, hour, mins };
}

function getTime() {
  const currentTime = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const month = months[currentTime.getMonth()];
  const dayOfTheWeek = days[currentTime.getDay()];
  const day = currentTime.getDate();
  const hour = currentTime.getHours();
  const mins = currentTime.getMinutes().toString().padStart(2, '0');
  document.getElementById('time').innerHTML = `${hour}:${mins}`;
  document.getElementById('date').innerHTML = `${dayOfTheWeek},<br />${month} ${day}`;
}

async function weatherForecastHTML(position) {
  const forecastURL = `/api/forecast/${position.coords.latitude}/${position.coords.longitude}`;
  const forecastData = await getData(forecastURL);
  forecastData.list.map((day, index, array) => {
    day.currentDay = new Date(day.dt * 1000).getDay();
  });
  const minMaxTemps = forecastData.list.reduce(function (obj, day) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const theday = days[day.currentDay];
    if (!obj[theday]) {
      obj[theday] = {};
    }
    if (!obj[theday]['min'] & !obj[theday]['max']) {
      obj[theday]['min'] = [];
      obj[theday]['max'] = [];
    } else {
      obj[theday]['min'].push(day.main.temp_min);
      obj[theday]['max'].push(day.main.temp_max);
    }
    return obj;
  }, {});

  let htmlForecast = '';
  for (let i = 0; i < forecastData.list.length; i += 8) {
    let dateNum = forecastData.list[i].dt;
    let { dayOfTheWeek, month, day, hour } = createDateComponents(dateNum, 'utc');
    const daysMinTemp = Math.min(...minMaxTemps[dayOfTheWeek]['min']);
    const daysMaxTemp = Math.max(...minMaxTemps[dayOfTheWeek]['max']);
    let iconValue = forecastData.list[i].weather[0].icon;
    let tempMin = Math.round(daysMinTemp);
    let tempMax = Math.round(daysMaxTemp);
    let weatherDescription = forecastData.list[i].weather[0].description;
    let weatherIcon = `${iconURL}${iconValue}@2x.png`;
    htmlForecast += `<div class="dayWeather">
                    <div><div class="dayDate">${dayOfTheWeek}</div><div class="forecastDescription">${weatherDescription}</div></div>
                    <div class="forecastWeatherIcon"><img src="${weatherIcon}"></div>
                    <div class="dayTemp">${tempMax} / ${tempMin} °C</div>
                    </div>`;
  }
  document.getElementById('forecast').innerHTML = htmlForecast;
}

async function currentWeatherHTML(position) {
  const currentURL = `/api/current/${position.coords.latitude}/${position.coords.longitude}`;
  const forecastData = await getData(currentURL);
  const currentTemp = Math.round(forecastData.main.temp, 0);
  const currentFeelsTemp = Math.round(forecastData.main.feels_like, 0);
  const currentDescription = forecastData.weather[0].description;
  const currentIconData = forecastData.weather[0].icon;
  const weatherIcon = `${iconURL}${currentIconData}@2x.png`;
  const tempMin = Math.round(forecastData.main.temp_min, 0);
  const tempMax = Math.round(forecastData.main.temp_max, 0);
  const humidity = forecastData.main.humidity;
  const windSpeed = Math.round(((forecastData.wind.speed * 60 * 60) / 1000) * 100) / 100;
  const windDirection = forecastData.wind.deg;
  const htmlCurrent = `
  <div class="cityName">${forecastData.name}</div>
  <div class="description">${currentDescription}: ${tempMin}°C / ${tempMax}°C</div>
  <div class="rows">
    <div class="weatherIcon"><img src="${weatherIcon}" /></div>
    <div class="currentTemp">${currentTemp}°C</div>
    <div class="feelsTemp">Feels Like: ${currentFeelsTemp}°C</div>
  </div>
  <div class="rows"><div>Current Wind:</div>
    <div id="currentWindDirection" style="transform: rotate(${windDirection}deg)">
    <svg width="50" height="50" data-testid="Icon" class="Icon--icon--2aW0V Icon--darkTheme--1PZ-8" set="current-conditions" name="wind-direction" theme="dark" viewBox="0 0 24 24"><title>Wind Direction</title><path stroke="currentColor" fill="white" d="M18.467 4.482l-5.738 5.738a1.005 1.005 0 0 1-1.417 0L5.575 4.482l6.446 16.44 6.446-16.44z"></path></svg>
    </div><div class="windSpeed">${windSpeed} km/h</div>
  </div>`;
  document.getElementById('currentWeather').innerHTML = htmlCurrent;
}

async function moonPhase(moonURL) {
  const moonData = await getData(moonURL);
  const htmlCurrent = `<div class="rows"><div>Moon Phase:</div><div class="moonPhase"><svg width="50" height="50" viewBox="0 0 100 100">${moonData.svg}</svg></div><div>${moonData.npWidget}</div></div>`;
  document.getElementById('moonphase').innerHTML = htmlCurrent;
}

async function getCalendarData(account) {
  if (!account) {
    document.getElementById('calendar').innerHTML =
      "<div class='calendarRow'><div class='dayOfTheMonth'>NEED AN ACCOUNT.</div></div>";
    return;
  }
  const calendarURL = `/api/calendar/${account}`;
  const data = await getData(calendarURL);
  const finalListOfEvents = data.reduce(function (obj, day) {
    const theday = day.formattedDate;
    if (!obj[theday]) {
      obj[theday] = { events: [day] };
    } else {
      obj[theday]['events'].push(day);
    }
    return obj;
  }, {});

  const eventList = Object.entries(finalListOfEvents).slice(0, 10);

  const dayNameList = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNameList = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  let dayDetails = '';
  eventList.map((day) => {
    let eventDetails = '';
    day[1]['events'].forEach((event) => {
      const calendarTime = new Date(event.sortDate);
      let startTime = calendarTime.toTimeString().split(':').slice(0, 2).join(':');
      let endTime = new Date(event.endTime).toTimeString().split(':').slice(0, 2).join(':');
      if (event.allDayEvent) {
        startTime = '';
        endTime = '';
      }
      let location = '';
      if (event.location) {
        if (event.location.length < 40) {
          location = ` - ${event.location.toUpperCase()}`;
        }
      }
      const summary = event.summary.toUpperCase();
      eventDetails += `<div class='eventRow'><div class='calendarSummary'>${summary}${location}</div><div class='calendarTime'>${startTime} - ${endTime}</div></div>`;
    });

    const offset = new Date().getTimezoneOffset();
    const convertedDate = new Date(Date.parse(day[0]) + offset * 60 * 1000);
    const monthName = monthNameList[convertedDate.getMonth()];
    const dayOfMonth = convertedDate.getDate();
    const dayName = dayNameList[convertedDate.getDay()];
    dayDetails += `<div class='calendarRow'><div class="dayOfTheMonth">${dayName}, ${monthName} ${dayOfMonth}</div>${eventDetails}</div>`;
  });
  document.getElementById('calendar').innerHTML = dayDetails;
}

getLocation();
getCalendarData(account);
getTime();
moonPhase(moonURL);

setInterval(() => {
  getTime();
}, 6000);

setInterval(() => {
  getLocation();
  getCalendarData(account);
}, 300000);

setInterval(() => {
  moonPhase(moonURL);
}, 21600000);

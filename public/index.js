const urlParams = new URLSearchParams(window.location.search);
const account = urlParams.get('account');

const lon = '-73.4529';
const lat = '44.6995';
// const URL = `https://api.openweathermap.org/forecastData/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`;
const iconURL = 'https://openweathermap.org/img/wn/';

const currentURL = '/api/current';
const forecastURL = '/api/forecast';
const moonURL = '/api/moon';

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
  let date = new Date(dateNum * 1000);
  let month = months[date.getMonth()];
  let dayOftheWeek = days[date.getDay()];
  let day = date.getDate();
  let hour = date.getHours();
  let mins = date.getMinutes().toString().padStart(2, '0');
  // let dateTxt = `${dayOftheWeek}, ${month} ${day} ${hour}`;
  return { dayOftheWeek, month, day, hour, mins };
}

function getTime() {
  const currentTime = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let month = months[currentTime.getMonth()];
  let dayOftheWeek = days[currentTime.getDay()];
  let day = currentTime.getDate();
  const hour = currentTime.getHours();
  const mins = currentTime.getMinutes().toString().padStart(2, '0');
  document.getElementById('time').innerHTML = `${hour}:${mins}`;
  document.getElementById('date').innerHTML = `${dayOftheWeek},<br />${month} ${day}`;
}

async function weatherForecastHTML(forecastURL) {
  // http://openweathermap.org/img/wn/10d@2x.png
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
    let { dayOftheWeek, month, day, hour } = createDateComponents(dateNum, 'utc');
    const daysMinTemp = Math.min(...minMaxTemps[dayOftheWeek]['min']);
    const daysMaxTemp = Math.max(...minMaxTemps[dayOftheWeek]['max']);
    let iconValue = forecastData.list[i].weather[0].icon;
    let tempMin = Math.round(daysMinTemp);
    let tempMax = Math.round(daysMaxTemp);
    let weatherDescription = forecastData.list[i].weather[0].description;
    let weatherIcon = `${iconURL}${iconValue}@2x.png`;
    htmlForecast += `<div class="dayWeather">
                    <div><div class="dayDate">${dayOftheWeek}</div><div class="forecastDescription">${weatherDescription}</div></div>
                    <div class="forecastWeatherIcon"><img src="${weatherIcon}"></div>
                    <div class="dayTemp">${tempMax} / ${tempMin} °C</div>
                    </div>`;
  }
  document.getElementById('forecast').innerHTML = htmlForecast;
}

async function currentWeatherHTML(currentURL) {
  const forecastData = await getData(currentURL);
  let currentTemp = Math.round(forecastData.main.temp, 0);
  let currentFeelsTemp = Math.round(forecastData.main.feels_like, 0);
  let currentDescription = forecastData.weather[0].description;
  let currentIconData = forecastData.weather[0].icon;
  let weatherIcon = `${iconURL}${currentIconData}@2x.png`;
  let tempMin = Math.round(forecastData.main.temp_min, 0);
  let tempMax = Math.round(forecastData.main.temp_max, 0);
  let humidity = forecastData.main.humidity;
  let windSpeed = Math.round(((forecastData.wind.speed * 60 * 60) / 1000) * 100) / 100;
  let windDirection = forecastData.wind.deg;
  let htmlCurrent = `
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
  let htmlCurrent = `<div class="rows"><div>Moon Phase:</div><div class="moonPhase"><svg width="50" height="50" viewBox="0 0 100 100">${moonData.svg}</svg></div><div>${moonData.npWidget}</div></div>`;
  document.getElementById('moonphase').innerHTML = htmlCurrent;
}

async function getCalendarData(account) {
  if (!account) {
    document.getElementById('calendar').innerHTML =
      "<div class='calendarRow'><div class='dayoftheMonth'>NEED AN ACCOUNT.</div></div>";
    return;
  }
  const calendarURL = `/api/calendar/${account}`;
  const data = await getData(calendarURL);
  const finalListofEvents = data.reduce(function (obj, day) {
    const theday = day.formattedDate;
    if (!obj[theday]) {
      obj[theday] = { events: [day] };
    } else {
      obj[theday]['events'].push(day);
    }
    return obj;
  }, {});

  let dayDetails = '';
  for (days in finalListofEvents) {
    let eventDetails = '';
    finalListofEvents[days]['events'].forEach((event) => {
      const calendarTime = new Date(event.sortDate);
      let startTime = calendarTime.toTimeString().split(':').slice(0, 2).join(':');
      let endTime = new Date(event.endTime).toTimeString().split(':').slice(0, 2).join(':');
      if (event.allDayEvent) {
        startTime = '';
        endTime = '';
      }
      // const endTime = (calendarTime + 1000 * 30 * 60).toLocaleTimeString();
      const summary = event.summary.toUpperCase();
      eventDetails += `<div class='eventRow'><div class='calendarSummary'>${summary}</div><div class='calendarTime'>${startTime} - ${endTime}</div></div>`;
    });
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
    const offset = new Date().getTimezoneOffset();
    const convertedDate = new Date(Date.parse(days) + offset * 60 * 1000);
    const monthName = monthNameList[convertedDate.getMonth()];
    const dayofMonth = convertedDate.getDate();
    const dayName = dayNameList[convertedDate.getDay()];
    dayDetails += `<div class='calendarRow'><div class="dayoftheMonth">${dayName}, ${monthName} ${dayofMonth}</div>${eventDetails}</div>`;
  }
  document.getElementById('calendar').innerHTML = dayDetails;
}

currentWeatherHTML(currentURL);
weatherForecastHTML(forecastURL);
getCalendarData(account);
getTime();
moonPhase(moonURL);

setInterval(() => {
  getTime();
}, 6000);

setInterval(() => {
  currentWeatherHTML(currentURL);
  weatherForecastHTML(forecastURL);
  getCalendarData(account);
}, 60000);

setInterval(() => {
  moonPhase(moonURL);
}, 86400000);

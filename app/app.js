const express = require('express');
const router = express.Router();
const axios = require('axios');
const { google } = require('googleapis');
require('dotenv').config();

const keys = JSON.parse(process.env.CREDENTIALS);

const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';
const GOOGLE_PRIVATE_KEY = keys.private_key;
const GOOGLE_CLIENT_EMAIL = keys.client_email;
const GOOGLE_PROJECT_NUMBER = keys.project_id;
const GOOGLE_CALENDAR_ID1 = process.env.GOOGLE_CALENDAR_ID1;
const GOOGLE_CALENDAR_ID2 = process.env.GOOGLE_CALENDAR_ID2;

const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY;

async function loadMoon(val) {
  const BASE_URL = 'https://www.icalendar37.net/lunar/api/?';
  let gets = [];
  for (let d in val) {
    gets.push(d + '=' + val[d]);
  }
  const today = new Date().getDate();
  const url = BASE_URL + gets.join('&');
  const data = await axios.get(url);
  return data.data.phase[today];
}

router.get('/moon', async (req, res, next) => {
  const configMoon = {
    lang: 'en',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  };

  const moon = await loadMoon(configMoon);
  res.json(moon);
});

router.get('/', (req, res, next) => {
  res.json('Hello World!');
});

router.get('/calendar/:email', async (req, res, next) => {
  const accountEmail = req.params.email;
  const jwtClient = new google.auth.JWT(accountEmail, null, GOOGLE_PRIVATE_KEY, SCOPES);
  const calendar = google.calendar({
    version: 'v3',
    project: GOOGLE_PROJECT_NUMBER,
    auth: jwtClient,
  });
  let results = [];
  const calendar1 = await calendar.events.list({
    calendarId: GOOGLE_CALENDAR_ID1,
    timeMin: new Date().toISOString(),
    maxResults: 20,
    singleEvents: true,
    showDeleted: false,
    orderBy: 'startTime',
  });
  const calendar2 = await calendar.events.list({
    calendarId: GOOGLE_CALENDAR_ID2,
    timeMin: new Date().toISOString(),
    maxResults: 20,
    singleEvents: true,
    showDeleted: false,
    orderBy: 'startTime',
  });
  results.push(...calendar1.data.items, ...calendar2.data.items);
  for (let i = 0; i < results.length; i++) {
    if (results[i].start.dateTime) {
      results[i].allDayEvent = false;
      results[i].sortDate = Date.parse(results[i].start.dateTime);
      results[i].endTime = Date.parse(results[i].end.dateTime);
    }
    if (results[i].start.date) {
      results[i].allDayEvent = true;
      const utcDifference = new Date().getTimezoneOffset() * 60 * 1000;
      results[i].sortDate = Date.parse(results[i].start.date) + utcDifference;
      results[i].endTime = Date.parse(results[i].end.date) + utcDifference;
    }
  }
  results.forEach((item) => {
    const month = new Date(item.sortDate).getMonth() + 1;
    const day = new Date(item.sortDate).getDate();
    const year = new Date(item.sortDate).getFullYear();
    item.formattedDate = `${year}-${month}-${day}`;
  });
  results.sort((a, b) => a.sortDate - b.sortDate);
  res.json(results);
});

router.get('/forecast/:lat/:lon', async (req, res, next) => {
  const lat = req.params.lat;
  const lon = req.params.lon;
  const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`;
  const data = await axios.get(forecastURL);
  res.json(data.data);
});

router.get('/current/:lat/:lon', async (req, res, next) => {
  const lat = req.params.lat;
  const lon = req.params.lon;
  const currentURL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`;
  const data = await axios.get(currentURL);
  res.json(data.data);
});

module.exports = router;

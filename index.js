const express = require('express');
const api = require('./app/app');
const app = express();

app.use(express.static('public'));
app.use('/api', api);
app.use(express.json());

const port = process.env.PORT || 3010;
app.listen(port, () => {
  /* eslint-disable no-console */
  console.log(`Listening: http://localhost:${port}`);
  /* eslint-enable no-console */
});

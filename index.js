const express = require('express');
const mongoose = require('mongoose');
const bluebird = require('bluebird');
const bodyParser = require('body-parser');
const path = require('path');

const stationController = require('./src/controllers/station');

const app = express();

app.use(bodyParser.json());

app.set('views', path.join(__dirname, 'src/views'));
app.set('view engine', 'twig');

mongoose.Promise = bluebird;

mongoose.connect(
  'mongodb+srv://root:pass@cluster-er2pl.gcp.mongodb.net/allopneus?retryWrites=true&w=majority',
  { 
    useNewUrlParser: true,
    useCreateIndex: true,
  },
  (error) => {
    if (error) {
      process.exit(1);
    }
  }
);

app.get('/api/stations', stationController.getStations);
app.get('/api/station/:id', stationController.getStation);

app.get('/*', (req, res) => {
  res.render('homepage', {
    title: 'Alena Privet',
  });
});

app.listen(4000, () => {
  console.log('Listening...');
});

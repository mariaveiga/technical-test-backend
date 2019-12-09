const config = require('config')
const express = require('express');
const bodyParser = require('body-parser');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
  level: 'debug',
  format: combine(
    label({ label: 'main' }), timestamp(),
    myFormat
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' }),
    new transports.Console()
  ]
});


let eventsMap = {}

const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.static('public'));


/*Añadir eventos*/

app.post('/events', (req, res) => {
  const event_name = req.body['event_name'];

  if (event_name === undefined) {
    res.status(400).send();
    return;
  }

  trimed_event_name = event_name.trim()

  if (trimed_event_name === 0) {
    res.status(400).send();
    return;
  }

  if (eventsMap[trimed_event_name] !== undefined) {
    res.status(409).send();
    return;
  }

  const type = req.body['type'];
  const date = req.body['date'];
  const city = req.body['city'];
  const description = req.body['description'];

  let eventsData = {};

  eventsData['Nombre'] = event_name;
  eventsData['Tipo'] = type;
  eventsData['Fecha'] = date;
  eventsData['Ciudad'] = city;
  eventsData['Descripcion'] = description;

  const entries = Object.entries(eventsData)

  /*Comprobar si los campos, excepto descripción, no están vacíos*/

  for (const [key, value] of entries) {
    if (key !== 'Descripcion' && (value === undefined || value.trim().length === 0)) {
      res.status(400).send('Faltan datos obligatorios');
      return     
    }
}
   eventsMap[trimed_event_name] = eventsData;
  res.send(eventsMap);
})


/*get para eventos*/
app.get('/events/:collection', (req, res) => {
  const collection = req.params['collection'];
  if (eventsMap[collection] === undefined) {
    res.status(404).send();
    return;
  }
  res.send(eventsMap[req.params.collection]);
});

/*Búsqueda general*/
app.get('/events/', (req, res) => {
  res.send(eventsMap);
});

const port = config.get('server.port');

app.listen(port, function () {
  logger.info(`Starting eventsnts of interest application listening on port ${port}`);
});

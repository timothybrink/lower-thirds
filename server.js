const express = require('express')
const app = express()
require('express-ws')(app)
const yargs = require('yargs')
const Presenter = require('./Presenter')
const Viewer = require('./Viewer')

let argv = yargs
  .option('address', {
    alias: 'a',
    type: 'string',
    description: 'Address to serve on (default localhost)'
  })
  .option('port', {
    alias: 'p',
    type: 'string',
    description: 'Port to serve on (default 5500)'
  }).argv

const HOST = argv.server || 'localhost'
const PORT = argv.port || '5500'

// Global presenter connection
const globalPresenter = new Presenter()

// References of active viewer connections
const viewers = []

// Static assets
app.use('/assets', express.static('./assets/'))

// Views (presenter and viewer)
app.use(express.static('./views', { extensions: ['html'] }))

// Websocket route for presenter view
app.ws('/ws-presenter', function (ws, req) {
  if (globalPresenter.active) return

  globalPresenter.activate(ws)
})

// WebSocket route for viewer view
app.ws('/ws-viewer', function (ws, req) {
  v = new Viewer(ws, globalPresenter)
  viewers.push(v)

  ws.on('close', () => viewers.splice(viewers.indexOf(v), 1))
})

// Error handling
app.use(function (req, res) {
  res.status(404).send('Not found.')
})

app.use(function (err, req, res, next) {
  if (res.headersSent)
    return next(err)

  console.error(err.stack)
  res.status(500).send('Error 500')
})

app.listen(PORT, HOST, function () {
  console.log(`Server listening on ${HOST}:${PORT}...`)
})
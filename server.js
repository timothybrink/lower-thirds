const express = require('express')
const yargs = require('yargs')
const fs = require('fs')
const path = require('path')

const wsRouter = require('./p2pws-router')
const app = express()

// Set up express-ws on app (for p2p ws)
require('express-ws')(app)

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

app.use(wsRouter)

// Static assets
app.use('/assets', express.static(path.join(__dirname, '/assets')))

// Views (presenter and viewer)
app.use(express.static(path.join(__dirname, '/views'), { extensions: ['html'] }))

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
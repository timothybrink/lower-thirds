const express = require('express')
const app = express()
require('express-ws')(app)
const ClientManager = require('./ClientManager')

/**
 * Simple class for client connections
 */
class Client {
  constructor(ws) {
    this.ws = ws
    this.isBroadcasting = false
  }

  send(obj) {
    this.ws.send(JSON.stringify(obj))
  }
}

// Client manager
const clientManager = new ClientManager()

// WebSocket route for clients
app.ws('/ws', function (ws, req) {
  let c = new Client(ws)
  clientManager.add(c)
})

module.exports = app
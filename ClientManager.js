class ClientManager {
  constructor() {
    this.clients = []
    // once we find out which connection is broadcasting, this will hold it
    this.broadcaster = null
  }

  add(client) {
    this.clients.push(client)

    // listen for close, to remove from active clients
    client.ws.on('close', () => this.clients.splice(this.clients.indexOf(client), 1))

    // listen for messages, to find the broadcaster
    client.ws.on('message', msg => {
      let { event, data } = JSON.parse(msg)

      if (event == 'begin-broadcast') {
        // This connection wants to broadcast
        if (this.broadcaster)
          client.send({ event: 'error', data: 'Broadcaster already exists!'})
        else
          this.setBroadcaster(client)
      }
    })
  }

  setBroadcaster(broadcaster) {
    this.broadcaster = broadcaster
    this.broadcaster.isBroadcasting = true

    // also add event listeners so that when we get a message from the
    // broadcaster, send it to all the clients.
    this.broadcaster.ws.on('message', msg => {
      let { event, data } = JSON.parse(msg)

      if (event == 'broadcast-data') {
        for (let client of this.clients) {
          client.send({ event, data })
        }
      }
    })
  }
}

module.exports = ClientManager
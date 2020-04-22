class Connection extends EventTarget {
  constructor(broadcasting = false) {
    super()
    this.open = false
    this.ws = null
    this.reconnectTime = 5000
    this.wsUrl = `ws://${location.host}/ws`
    this.broadcasting = broadcasting
  }
  /**
   * Set the state of the connection (open, not open)
   * @param {Boolean} open Set if the connection is open or not
   */
  setStatus(open) {
    if (this.open !== open) {
      let event = new Event(open ? 'open' : 'close')
      this.dispatchEvent(event)
      this.open = open
    }
  }

  init() {
    // Open websocket to server
    this.ws = new WebSocket(this.wsUrl)

    this.ws.addEventListener('open', () => {
      this.setStatus(true)

      if (this.broadcasting) {
        this.ws.send(JSON.stringify({
          event: 'begin-broadcast'
        }))
      }
    })

    this.ws.addEventListener('close', () => {
      this.setStatus(false)
      setTimeout(() => this.init(), this.reconnectTime)
    })

    this.ws.addEventListener('message', e => {
      let { event, data } = JSON.parse(e.data)

      if (event == 'broadcast-data') {
        let de = new Event('message')
        de.data = data
        this.dispatchEvent(de)
      } else if (event == 'error') {
        let ee = new Event('error')
        ee.data = data
        this.dispatchEvent(ee)
      }
    })
  }

  send(data) {
    if (!this.broadcasting) throw new Error('Not a broadcasting connection!')

    this.ws.send(JSON.stringify({
      event: 'broadcast-data',
      data
    }))
  }
}
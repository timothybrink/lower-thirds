ui.init()

class Connection extends EventTarget {
  constructor() {
    super()
    this.open = false
  }
  /**
   * Set the state of the connection (open, not open)
   * @param {Boolean} open Set if the connection is open or not
   */
  set(open) {
    if (this.open !== open) {
      let event = new Event(open ? 'open' : 'close')
      this.dispatchEvent(event)
      this.open = open
    }
  }
}

let ws
let connectionStatus = new Connection()

function initWebSocket(retry) {
  // Open websocket to server
  ws = new WebSocket(`ws://${location.host}/ws-presenter`)
  if (retry) console.log('Trying to connect...')

  ws.addEventListener('open', function (event) {
    connectionStatus.set(true)
  })

  ws.addEventListener('close', function (event) {
    connectionStatus.set(false)
    setTimeout(() => initWebSocket(true), 5000)
  })
}

initWebSocket()

connectionStatus.addEventListener('open', e => {
  ui.enable()
  console.log('Connection to server open')
})
connectionStatus.addEventListener('close', e => {
  ui.disable('Connection to server lost. Trying again in 5 seconds.')
  console.log('Connection to server lost.')
})

let presStarted = false

function startPresentation(textValues) {
  ws.send(JSON.stringify({
    event: 'init-presentation',
    data: textValues
  }))

  presStarted = true

  console.log('submitted, ', textValues)
}

function goto(index) {
  ws.send(JSON.stringify({
    event: 'goto-slide',
    data: index
  }))
}
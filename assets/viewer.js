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

// This is the array of text values that will be displayed.
let textValues = []

function initWebSocket(retry) {
  // Open websocket to server
  ws = new WebSocket(`ws://${location.host}/ws-viewer`)
  if (retry) console.log('Trying to connect...')

  ws.addEventListener('open', function (event) {
    connectionStatus.set(true)
  })

  ws.addEventListener('close', function (event) {
    connectionStatus.set(false)
    setTimeout(() => initWebSocket(true), 5000)
  })

  ws.addEventListener('message', function (e) {
    let { event, data } = JSON.parse(e.data)

    // special websocket events
    if (event == 'open') {
      yadl.select('#main-content').text('Waiting for presenter to begin...')
    }

    if (event == 'close') {
      yadl.select('#main-content').text('Nothing to show here...')
    }

    // slide events
    if (event == 'init-presentation') {
      yadl.select('#main-content').text('')
      textValues = data
      for (let i = 0; i < textValues.length; i++) {
        yadl.create('span')
          .setId('item-' + i)
          .setClass('text-item')
          .text(textValues[i])
          .attach(yadl.select('#main-content'))
      }
    }

    if (event == 'goto-slide') {
      let item = yadl.select('#item-' + data)
      if (item.length != 0) {
        item.classList.add('visible')
        setTimeout(function () {
          item.classList.remove('visible')
        }, 6000)  /// TIME TO SHOW 
      }
    }
  })
}

initWebSocket()

connectionStatus.addEventListener('open', e => {
  console.log('Connection to server open')
})
connectionStatus.addEventListener('close', e => {
  console.log('Connection to server lost.')
})
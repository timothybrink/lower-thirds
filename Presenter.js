const EventEmitter = require('events')
const fs = require('fs')

/**
 * A presenter connection
 */
class Presenter extends EventEmitter {
  constructor() {
    super()
    this.active = false
    this.ws = null
    this.status = 'closed'
    this.data = null
    this.currentIndex = null
  }

  activate(ws) {
    this.ws = ws
    this.active = true
    this.emit('open')

    this.ws.on('message', msg => {
      try {
        let { event, data } = JSON.parse(msg)

        if (event == 'init-presentation') {
          // In this case, data is the list of text values
          this.data = data
        }
        if (event == 'goto-slide') {
          // In this case, data is the index of the slide to switch to.
          this.currentIndex = data
        }

        this.emit('update', event, data)
      } catch (e) {
        console.error(e)
      }
    })

    this.ws.on('close', () => { this.close() })
  }

  close() {
    this.ws = null
    this.active = false
    this.emit('close')
    this.status = 'closed'
    this.data = null
    this.currentIndex = null
  }
}

module.exports = Presenter
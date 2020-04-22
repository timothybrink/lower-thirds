/**
 * A viewer connection.
 */
class Viewer {
  /**
   * Initiate a new viewer connection
   * @param {WebSocket} ws WebSocket for this viewer
   * @param {Presenter} presenter Presenter object to listen to
   */
  constructor(ws, presenter) {
    this.ws = ws
    this.presenter = presenter

    this.presenter
      .on('open', () => this.send('open'))
      .on('close', () => this.send('close'))
      .on('update', (event, data) => this.send(event, data))

    if (this.presenter.active) {
      // a 'catch-up' sequence of events
      this.send('open')
      if (this.presenter.data)
        this.send('init-presentation', this.presenter.data)
      if (this.presenter.currentIndex)
        this.send('goto-slide', this.presenter.currentIndex)
    }
  }

  send(event, data) {
    if (this.ws.readyState == 1)
      this.ws.send(JSON.stringify({ event, data }))
  }
}

module.exports = Viewer
ui.init()
const connection = new Connection(true)
connection.init()

connection.addEventListener('open', e => {
  ui.enable()
  console.log('Connection to server open')
})
connection.addEventListener('close', e => {
  ui.disable('Connection to server lost. Trying again in 5 seconds.')
  console.log('Connection to server lost.')
})

const presenter = {}

presenter.current = ''

presenter.show = function (text) {
  presenter.current = text
  connection.send({ event: 'show-text', data: text })
}

presenter.clear = function () {
  presenter.current = ''
  connection.send({ event: 'clear' })
}

presenter.toggle = function (text) {
  if (presenter.current) {
    // Hide
    presenter.clear()
  } else {
    // Show text
    presenter.show(text)
  }
}

presenter.showFor = function (text, length) {
  presenter.current = text
  connection.send({ event: 'show-text', data: text, length })
  setTimeout(function () {
    presenter.current = ''
  }, length * 1000)
}
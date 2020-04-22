const connection = new Connection()
connection.init()

connection.addEventListener('open', e => {
  console.log('Connection to server open')
})
connection.addEventListener('close', e => {
  console.log('Connection to server lost.')
})

connection.addEventListener('message', e => {
  let { event, data, length } = e.data

  if (event == 'show-text') {
    yadl.select('#main-content').text(data).setClass('visible')

    if (typeof length == 'number') {
      setTimeout(function () {
        yadl.select('#main-content').removeClass('visible')
      }, length)
    } 
  } else if (event == 'clear') {
    yadl.select('#main-content').removeClass('visible')
  } else {
    console.log(`Received event ${event} with data`, data)
  }
})
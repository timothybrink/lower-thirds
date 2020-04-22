const ui = {}

ui.accelerators = []

ui.init = function () {
  window.addEventListener('load', e => {
    ui.toastElement = yadl.create('.toast').attach()
    ui.disabler = yadl.create('.disabler').attach()
    ui.initAccelerators()
    ui.textEditor.init()

    yadl.select('#start').listen('click', function (e) {
      e.preventDefault()

      startPresentation(ui.textEditor.slides)

      this.remove()
    })
  })
}

ui.initAccelerators = function () {
  window.addEventListener('keydown', function (e) {
    let accel = ui.accelerators.find(a => a.key == e.key)
    if (!accel) return

    e.preventDefault()
    if (typeof accel.handler == 'function') accel.handler(e)
  })
}

ui.toast = function (message, time = 5) {
  ui.toastElement.text(message)
  ui.toastElement.setClass('visible')

  if (time != 0)
    setTimeout(() => ui.toastElement.removeClass('visible'), time * 1000)
}

ui.addAccelerator = function (key, handler) {
  ui.accelerators.push({ key, handler })
}

ui.disable = function (msg) {
  ui.toast(msg, 0)
  ui.disabler.setClass('visible')
}

ui.enable = function () {
  if (ui.toastElement)
    ui.toastElement.removeClass('visible')
  if (ui.disabler)
    ui.disabler.removeClass('visible')
}

ui.textEditor = {}

ui.textEditor.slides = []
ui.textEditor.addSlide = function (content) {
  let index = ui.textEditor.slides.push(content) - 1
  yadl.create('div')
    .attach(yadl.select('#slides'))
    .append(yadl.create('span').text(content))
    .append(yadl.create('button')
      .text('Show')
      .listen('click', () => {if (presStarted) goto(index)}))
}

ui.textEditor.init = function () {
  ui.textEditor.form = document.forms.textInput
  ui.textEditor.form.addEventListener('submit', function (e) {
    e.preventDefault()

    ui.textEditor.addSlide(this.elements[0].value)

    this.elements[0].value = ''
  })
}
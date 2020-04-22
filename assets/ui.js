const ui = {}

ui.accelerators = []

ui.init = function () {
  window.addEventListener('load', e => {
    ui.toastElement = yadl.create('.toast').attach()
    ui.disabler = yadl.create('.disabler').attach()
    ui.initAccelerators()

    // Add initial slot
    ui.textEditor.addSlot()

    yadl.select('#add-button').listen('click', () => ui.textEditor.addSlot())
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

ui.textEditor.slots = []
ui.textEditor.newSlot = function () {
  let textSpan = yadl.create('span')
    .text('Enter text here...')
    .set('contentEditable', 'true')
    .listen('focus', function () {
      if (this.parentElement.classList.contains('empty'))
        ui.selectText(this)
    })
    .listen('input', function (e) {
      this.parentElement.classList.remove('empty')

      if (e.inputType == 'insertParagraph') {
        // Add new slot after this one and focus
        ui.textEditor.addSlot(this.parentElement)
        this.parentElement.nextSibling.children[1].focus()
        // remove any elements that were added by the insertParagraph
        for (let i = 0; i < this.children.length; i) {
          this.children[i].remove()
        }
      }
    })
  return yadl.create('li')
    .append(yadl.create('button')
      .text('x')
      .setClass('delete')
      .listen('click', function () {
        this.parentElement.remove()
      }))
    .append(textSpan)
    .append(yadl.create('button')
      .text('Toggle')
      .listen('click', ui.textEditor.toggleHandler(textSpan)))
    .append(yadl.create('button')
      .text('Show')
      .listen('click', ui.textEditor.showHandler(textSpan)))
}

/**
 * Add a new slot to the list of slots.
 * If node is provided, it is an HTML (not yadl) node after which
 * to insert the new node. Otherwise, the new node
 * will be added at the end.
 */
ui.textEditor.addSlot = function (node) {
  let slot = ui.textEditor.newSlot()
  if (node) {
    node.parentElement.insertBefore(slot._element, node.nextSibling)
  } else {
    yadl.select('#slots').append(slot)
  }
  slot.setClass('empty')
}

ui.textEditor.toggleHandler = function (textElement) {
  return function (e) {
    let text = textElement.get('textContent')
    presenter.toggle(text)
    if (presenter.current == text) {
      ui.textEditor.setAllHide()
      ui.textEditor.disableShows()
    } else {
      ui.textEditor.setAllToggle()
      ui.textEditor.enableShows()
    }
  }
}

ui.textEditor.showHandler = function (textElement) {
  return function (e) {
    let text = textElement.get('textContent')
    let length = Number(yadl.select('#show-length').get('value'))
    presenter.showFor(text, length)
    ui.textEditor.disableShows()
    ui.textEditor.setAllHide()

    setTimeout(() => {
      ui.textEditor.enableShows()
      ui.textEditor.setAllToggle()
    }, length * 1000)
  }
}

// Some methods for enabling/disabling/updating buttons en masse
ui.textEditor.disableShows = function () {
  yadl.select('#slots').children.forEach(li => {
    li.children[3].set('disabled', true)
  })
}
ui.textEditor.enableShows = function () {
  yadl.select('#slots').children.forEach(li => {
    li.children[3].set('disabled', false)
  })
}

ui.textEditor.setAllHide = function () {
  yadl.select('#slots').children.forEach(li => {
    li.children[2].text('Hide')
  })
}
ui.textEditor.setAllToggle = function () {
  yadl.select('#slots').children.forEach(li => {
    li.children[2].text('Toggle')
  })
}

ui.selectText = function (node) {
  if (document.body.createTextRange) {
    const range = document.body.createTextRange()
    range.moveToElementText(node)
    range.select()
  } else if (window.getSelection) {
    const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(node)
    selection.removeAllRanges()
    selection.addRange(range)
  } else {
    console.warn("Could not select text in node: Unsupported browser.");
  }
}
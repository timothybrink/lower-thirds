const yadl = {}

if (typeof window != 'undefined')
  yadl.document = window.document

// Flag for in-memory persistance of the vDom
yadl.persistant = false

// The root element for a vDom
yadl.root = null

/**
 * The base yadl.Element class.
 */
yadl.Element = class {
  /**
   * Helper function to parse a CSS selector-like string
   * into tagname, id, and classes components. The first
   * part is assumed to be the tag name unless it is
   * preceded by a # or ., in which case the tagname is
   * assumed to be 'div'. If more than one #str is found,
   * uses the first one as the id.
   * @param {String} str The string to parse
   * @returns {Object} {tagName, id, classes[]}
   */
  static parseTypeString(str) {
    // Process string
    let splitStr = str.split('#').map((s, i) => i == 1 ? '#' + s : s)
    splitStr = splitStr.map(s => s.split('.').map((s2, i) => i != 0 ? '.' + s2 : s2))
    splitStr = splitStr.flat()

    // First element is tagname unless it begins with # or .,
    // in which case tagname is 'div'.
    let tagName
    if (!splitStr[0])
      tagName = 'div'
    else
      tagName = splitStr.splice(0, 1)[0]

    let idIndex = splitStr.findIndex(s => s.startsWith('#'))
    let id
    if (idIndex >= 0) {
      id = splitStr.splice(idIndex, 1)[0].slice(1)
    }
    let classes = []
    for (let s of splitStr) {
      // This should be true unless there is an extra #
      if (s.startsWith('.')) {
        classes.push(s.slice(1))
      }
    }

    let result = { tagName }
    if (id) result.id = id
    if (classes.length) result.classes = classes

    return result
  }

  /**
   * Base element constructor. Not meant for general usage,
   * Parses the type parameter for tagname, classes, and
   * id (via yadl.Element.parseTypeString())
   * @param {string} type The type of the element to create.
   */
  constructor(type, doc) {
    if (type) {
      let {tagName, id, classes} = yadl.Element.parseTypeString(type)
      this._element = document.createElement(tagName)
      if (id) this._element.id = id
      if (classes) this._element.classList.add(...classes)
    } else
      this._element = null

    this._children = []
    this._parent = null

    this.hooks = []
    this.isMounted = false
    this.document = doc
  }

  /**
   * Get HTMLElement property
   * @param {string} name The property to look up
   */
  get(name) {
    if (!(name in this._element)) {
      throw new Error(`${name} is not defined on this element`)
    }

    return this._element[name]
  }

  /**
   * Set HTMLElement property
   * @param {string} name The property to update
   * @param {any} value The value to update to
   */
  set(name, value) {
    if (!(name in this._element)) {
      throw new Error(`${name} is not defined on this element`)
    }

    this._element[name] = value

    let hook = this.hooks.find(i => i.attr == name)
    if (hook) {
      hook.handler(name, value)
    }

    return this
  }

  /**
   * Wrapper for the native Element.setAttribute.
   * @param {string} name The name of HTML attribute to set
   * @param {string} value The value to set
   */
  setAttribute(name, value) {
    this._element.setAttribute(name, value)
    return this
  }

  /**
   * Setter for Element.style properties
   * @param {string} name The name of the CSS property to set
   * @param {any} value The value to set the property to
   */
  style(name, value) {
    if (!(name in this._element.style)) {
      throw new Error(`${name} is not defined in this style object`)
    }

    this._element.style[name] = value

    let hook = this.hooks.find(i => i.attr == 'style.' + name)
    if (hook) {
      hook.handler('style.' + name, value)
    }

    return this
  }

  /**
   * Setter for Element.textContent
   * @param {string} value The value to set Element.textContent to
   */
  text(value) {
    this._element.textContent = value

    let hook = this.hooks.find(i => i.attr == 'textContent')
    if (hook) {
      hook.handler('textContent', value)
    }

    return this
  }

  /**
   * Add hooks
   * @param {string} attr The attribute to listen on
   * @param {function} handler The handler to execute
   */
  addHook(attr, handler) {
    if (typeof attr !== 'string')
      throw new TypeError('attr is not a string!')
    if (typeof handler !== 'function')
      throw new TypeError('handler is not a function!')

    this.hooks.push({ attr, handler })
    return this
  }

  /**
   * addEventListener wrapper
   * @param {string} event The event to listen for
   * @param {function} handler The event handler
   */
  listen(event, handler) {
    this._element.addEventListener(event, handler)
    return this
  }

  /**
   * querySelector wrapper
   * @param {string} query The query to search
   */
  select(query) {
    let elements = []

    if (yadl.persistant) {
      if (this.matches(query)) elements.push(this)

      let selectResults = this._children.map(i => i.select(query))
      selectResults.forEach(i => {
        if (i.length === 0)
          return
        else if (typeof i.length === 'undefined')
          elements.push(i)
        else
          elements = elements.concat(i)
      })
    } else {
      let rawElements = Array.from(this._element.querySelectorAll(query))
      elements = rawElements.map(yadl.wrap)
    }

    if (elements.length == 0)
      return []

    if (elements.length == 1)
      return elements[0]

    return elements
  }

  /**
   * Wrapper for Element.matches
   * @param {string} query The selector to check
   */
  matches(query) {
    if (this._element.matches)
      return this._element.matches(query)
    else
      return false
  }

  /**
   * Append a new child to this element
   * @param {yadl.Element} element The element to append to this element
   */
  append(element) {
    if (element.isMounted)
      throw new Error('Element already mounted')

    if (element._element) {
      this._element.appendChild(element._element)
      element.isMounted = true

      if (yadl.persistant) {
        this._children.push(element)
        element._parent = this
      }
    } else {
      this._element.appendChild(element)

      if (yadl.persistant) {
        let yadlElt = yadl.wrap(element)
        yadlElt._parent = this
        this._children.push(yadlElt)
      }
    }

    let appendHook = this.hooks.find(i => i.attr = 'newChild')
    if (appendHook)
      appendHook.handler('newChild', element)

    return this
  }

  /**
   * Attach this element to a parent
   * @param {yadl.Element} parent The parent to attach this element to
   */
  attach(parent) {
    if (!parent)
      parent = yadl.root ? yadl.root.body : this.document.body

    if (this.isMounted)
      throw new Error('Element already mounted')

    if (typeof parent._element == 'undefined')
      parent.appendChild(this._element)
    else
      parent.append(this)

    return this
  }

  /**
   * Initiates the vDom for this element
   */
  init() {
    Array.from(this._element.children).forEach(child => {
      let newYElt = yadl.wrap(child).init()
      newYElt._parent = this
      this._children.push(newYElt)
    })

    return this
  }

  /**
   * Return the children of this element, wrapped.
   */
  get children() {
    if (!this._children.length)
      return Array.prototype.map.call(this._element.children, yadl.wrap)
    else
      return this._children
  }

  /**
   * Return the parent of this element, wrapped.
   */
  get parent() {
    if (!yadl.persistant)
      return yadl.wrap(this._element.parentElement)
    else
      return this._parent
  }

  /**
   * Expose the native classList API
   */
  get classList() {
    return this._element.classList
  }

  /**
   * Wrapper for native remove()
   */
  remove() {
    this.parent.removeChild(this)

    let hook = this.hooks.find(i => i.attr == 'remove')
    if (hook)
      hook.handler('remove', null)
  }

  /**
   * Wrapper for native removeChild()
   * @param {Element} childNode The child to remove
   */
  removeChild(childNode) {
    if (childNode._element)
      this._element.removeChild(childNode._element)
    else
      this._element.removeChild(childNode)

    if (yadl.persistant && childNode._element) {
      let index = this._children.indexOf(childNode)

      if (index === -1)
        throw new Error('childNode not found in Element.removeChild call')
      else
        this._children.splice(index, 1)
    }

    let hook = this.hooks.find(i => i.attr == 'removeChild')
    if (hook)
      hook.handler('removeChild', null)
    
    return this
  }

  /**
   * Wrapper for set Element.classList.add()
   * @param  {...String} classes The classes to add
   */
  setClass(...classes) {
    this._element.classList.add(...classes)
    return this
  }

  /**
   * Wrapper for Element.classList.remove()
   * @param  {...STring} classes The classes to remove
   */
  removeClass(...classes) {
    this._element.classList.remove(...classes)
    return this
  }

  /**
   * Wrapper for set Element.id
   * @param {String} id The id to use
   */
  setId(id) {
    this._element.id = id
    return this
  }
}

yadl.wrap = function (htmlElement) {
  let vElement = new yadl.Element()
  vElement._element = htmlElement
  vElement.document = htmlElement.ownerDocument || htmlElement  // If the ownerDocument is null, hopefully the element is a Document instance
  return vElement
}

yadl.create = function (type) {
  return new yadl.Element(type, yadl.document)
}

yadl.select = function (query) {
  if (yadl.root)
    return yadl.root.select(query)
  else
    return yadl.wrap(yadl.document)
    .select(query)
}

/**
 * Initializes a persistant vDom. Sets persistant to true,
 * parses the document into a vDom, and sets yadl.root.
 * @param {Document} document   The document to initialize.
 */
yadl.init = function (document) {
  if (!document) {
    document = yadl.document
  } else {
    yadl.document = document
  }

  yadl.persistant = true

  yadl.root = yadl.wrap(document)

  yadl.root.init()
  yadl.root.body = yadl.select('body')
}

if (typeof module !== 'undefined')
  module.exports = yadl
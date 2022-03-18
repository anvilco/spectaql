function scrollSpy () {
  var INIT_DELAY_MS = 300
  var SCROLL_DEBOUNCE_MS = 30
  var RESIZE_DEBOUNCE_MS = 50

  var PADDING = 0 // TODO: dynamically figure this out
  var ACTIVE_CLASS = 'nav-scroll-active'
  var EXPAND_CLASS = 'nav-scroll-expand'
  var EXPANDABLE_SELECTOR = '.nav-group-section'

  var currentIndex = null
  var sections = [] // [{ id: 'query-someQuery', top: 1234 }]

  function init () {
    findScrollPositions()
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleResize)
  }

  function findScrollPositions () {
    // Inspired by: https://codepen.io/zchee/pen/ogzvZZ
    currentIndex = null
    var allScrollableItems = document.querySelectorAll('[data-traverse-target]')
    Array.prototype.forEach.call(allScrollableItems, function (e) {
      sections.push({ id: e.id, top: e.offsetTop })
    })
  }

  handleResize = debounce(function () {
    findScrollPositions()
    handleScroll()
  }, RESIZE_DEBOUNCE_MS)

  handleScroll = debounce(function () {
    var scrollPosition = document.documentElement.scrollTop || document.body.scrollTop
    var index = getVisibleSectionIndex(scrollPosition)

    if (index === currentIndex) {
      return
    }

    currentIndex = index
    var section = sections[index]

    var getParentSection = function (el) {
      if (!el || !el.closest) return null
      return el.closest(EXPANDABLE_SELECTOR)
    }

    var activeEl = document.querySelector(`.${ACTIVE_CLASS}`)
    var nextEl = section
      ? document.querySelector('a[href*=' + section.id + ']')
      : null

    var parentNextEl = getParentSection(nextEl)
    var parentActiveEl = getParentSection(activeEl)
    var isDifferentParent = parentActiveEl !== parentNextEl

    if (parentActiveEl && isDifferentParent) {
      parentActiveEl.classList.remove(EXPAND_CLASS)
    }
    if (parentNextEl && isDifferentParent) {
      parentNextEl.classList.add(EXPAND_CLASS)
    }

    if (nextEl) {
      nextEl.classList.add(ACTIVE_CLASS)
      if (nextEl.scrollIntoViewIfNeeded) {
        nextEl.scrollIntoViewIfNeeded()
      } else if (nextEl.scrollIntoView) {
        nextEl.scrollIntoView({ behavior: 'smooth' })
      }
    }

    if (activeEl) {
      activeEl.classList.remove(ACTIVE_CLASS)
    }
  }, SCROLL_DEBOUNCE_MS)


  function getVisibleSectionIndex (scrollPosition) {
    var positionToCheck = scrollPosition + PADDING
    for (var i = 0; i < sections.length; i++) {
      var section = sections[i]
      var nextSection = sections[i + 1]
      if (scrollPosition >= section.top && (!nextSection || scrollPosition < nextSection.top)) {
        return i
      }
    }
    return -1
  }

  setTimeout(init, INIT_DELAY_MS)
}

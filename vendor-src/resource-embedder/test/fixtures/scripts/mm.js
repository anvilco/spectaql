window.matchMedia =
  window.matchMedia ||
  (function (a) {
    'use strict'
    var c,
      d = a.documentElement,
      e = d.firstElementChild || d.firstChild,
      f = a.createElement('body'),
      g = a.createElement('div')
    return (
      (g.id = 'mq-test-1'),
      (g.style.cssText = 'position:absolute;top:-100em'),
      (f.style.background = 'none'),
      f.appendChild(g),
      function (a) {
        return (
          (g.innerHTML =
            '&shy;<style media="' +
            a +
            '"> #mq-test-1 { width: 42px; }</style>'),
          d.insertBefore(f, e),
          (c = 42 === g.offsetWidth),
          d.removeChild(f),
          { matches: c, media: a }
        )
      }
    )
  })(document)
alert('hi')
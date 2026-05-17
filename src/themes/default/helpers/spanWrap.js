// Wraps a string in a span with a class
//
// Options:
//   clazz (String)
const escapeHtml = (input) => String(input).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))

module.exports = function (value, options) {
  const className = options?.hash?.className
  const safeClassName = typeof className === 'string' && /^[a-zA-Z0-9_- ]+$/.test(className) ? className : ''

  return `<span class="${escapeHtml(safeClassName)}">${escapeHtml(value)}</span>`
}

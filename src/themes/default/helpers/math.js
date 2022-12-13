module.exports = function (lvalue, operator, rvalue) {
  lvalue = parseFloat(lvalue)
  rvalue = parseFloat(rvalue)
  return {
    '+': lvalue + rvalue,
    '-': lvalue - rvalue,
    '*': lvalue * rvalue,
    '/': lvalue / rvalue,
    '%': lvalue % rvalue,
  }[operator]
}

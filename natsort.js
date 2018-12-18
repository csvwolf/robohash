const handle = (path) => {
  return path.split('#')[1]
}

module.exports = (curr, next) => {
  if (isNaN(parseInt(handle(curr)))) {
    return 1
  }
  if (isNaN(parseInt(handle(next)))) {
    return -1
  }

  return parseInt(handle(curr)) - parseInt(handle(next))
}

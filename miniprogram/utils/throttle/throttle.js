function throttle(fn, gapTime) {
  if (gapTime == null || gapTime == undefined) {
    gapTime = 1000
  }

  let _lastTime = null

  // 返回新的函数
  return function (e) {
    console.log(this)
    let _nowTime = + new Date()
    if (_nowTime - _lastTime > gapTime || !_lastTime) {
      fn(this, e)    //上方法不可行的解决办法 改变this和e
      _lastTime = _nowTime
    }
  }
}
module.exports = {
  throttle: throttle
}
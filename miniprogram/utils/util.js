const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

const showTip = title => {
  wx.showToast({
    title: title,
    icon: 'none',
    duration: 1500,
    mask: true
  })
}

const getFileId = imageUrl => {
  let s1 = imageUrl.toString().substring(0, 32);
  let s2 = imageUrl.toString().substring(43);
  return s1.concat(s2);
}

module.exports = {
  formatTime: formatTime,
  showTip: showTip,
  getFileId: getFileId
}

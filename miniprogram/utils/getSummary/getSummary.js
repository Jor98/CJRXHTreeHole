function getSummary(content) {
  if (content.length <= 50) {
    content = content;
  } else {
    content = content.slice(0, 50) + '...';
  }
  return content;
}

module.exports = {
  getSummary: getSummary

}
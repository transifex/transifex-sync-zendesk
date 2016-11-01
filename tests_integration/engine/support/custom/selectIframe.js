module.exports = function (iframe, done) {
  return this.browser
    .frame(0)
    .call(done);
};

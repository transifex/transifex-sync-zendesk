module.exports = function (done) {
  var that = this;
  setTimeout(function() {
    that.browser
      .call(done);
  }, 1200);
};

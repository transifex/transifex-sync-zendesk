module.exports = function (selector, done) {
  this.browser.execute(function(selector) {
    return $(selector).trigger('click');
  }, selector).then(function() {}).call(done);
};

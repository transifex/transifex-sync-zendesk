module.exports = {

  getLocale: function(t) {
    var arr = t.translations;
    return _.pluck(arr, 'locale');
  }
};
module.exports = {
  helpers: {
    checkPagination: function(a) {
      var i = a.page_count;
      if (typeof i === 'string') {
        i = parseInt(i, 10);
      }
      if (typeof i === 'number') {
        if (i > 1) {
          return true;
        }
      }
      return false;
    },
    getPages: function(a) {
      var i = a.page_count;
      return _.range(1, i + 1);
    },
    getCurrentPage: function(a) {
      var i = a.page;
      return i;
    },
    isFewer: function(a, i) {
      if (i > 1) {
        return true;
      }
      return false;
    },
    isMore: function(a, i) {
      if (a.page_count > i) {
        return true;
      }
      return false;
    },
  }
}

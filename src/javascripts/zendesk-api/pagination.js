var pagination = module.exports = {
  helpers: {
    checkPagination: a => {
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
    getPages: a => _.range(1, a.page_count + 1),
    getCurrentPage: a => a.page,
    isFewer: (a, i) => (i > 1),
    isMore: (a, i) => (a.page_count > i),
  }
};

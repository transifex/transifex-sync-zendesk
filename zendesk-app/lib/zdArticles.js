module.exports = {
  getIdList: function(a) {

    var l = a.articles.length;
    var arr = [];
    for (var i = 0; i < l; i++) {
      arr[i] = a.articles[i].id;
    }
    return arr;
  },
  getName: function(id, a) {

    var i = _.findIndex(a.articles, {
      id: id
    });
    return a.articles[i]["name"];
  },
  getTitle: function(id, a) {

    var i = _.findIndex(a.articles, {
      id: id
    });
    return a.articles[i]["title"];
  },
  getBody: function(id, a) {

    var i = _.findIndex(a.articles, {
      id: id
    });
    return a.articles[i]["body"];
  },
  getSourceLocale: function(id, a) {

    var i = _.findIndex(a.articles, {
      id: id
    });
    return a.articles[i]["source_locale"];
  },
  getLocale: function(id, a) {

    var i = _.findIndex(a.articles, {
      id: id
    });
    return a.articles[i]["locale"];
  }
};
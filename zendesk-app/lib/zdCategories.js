var syncUtil = require('syncUtil');

module.exports = {
  resources: {
    ZD_OBJECT_PATTERN: /(articles|sections|categories)/,
    ZD_ID_FORMAT_PATTERN: /^\d+$/
  },
  getIdList: function(a) {

    var l = a.articles.length;
    var arr = [];
    for (var i = 0; i < l; i++) {
      arr[i] = a.articles[i].id;
    }
    return arr;
  },

  //todo - refactor me
  getTxRequest: function(a) { // articles or article
    var arr = [];
    if (a.articles instanceof Array) {
      var l = this.getIdList(a);
    } else {
      var l = [];
      l[0] = a.id;
    }


    for (var i = 0; i < l.length; i++) {
      var req = {
        name: this.createResourceName(l[i], 'articles', '-'),
        slug: this.createResourceName(l[i], 'articles', '-'),
        priority: 0,
        i18n_type: 'KEYVALUEJSON'
      };


      var o = {};
      var o1 = syncUtil.addString('name', this.getName(l[i], a), o);
      var o2 = syncUtil.addString('title', this.getTitle(l[i], a), o1);
      var o3 = syncUtil.addString('body', this.getBody(l[i], a), o2);
      var o4 = syncUtil.addContent(req, o3);
      arr[i] = o4;
    }
    if (a.articles instanceof Array) {
      return arr;
    } else {
      return arr[0];
    }

  },
  createResourceName: function(zdId, zdObjectType, separator) {
    // Key the resource name to the updated zd object
    if (this.validZdObject(zdObjectType))
      if (this.validZdIdFormat(zdId))
        return zdObjectType.toLowerCase() + separator + zdId;
    throw "util.createResourceName:InvalidParameter";
  },
  validZdObject: function(o) {
    var r = this.resources.ZD_OBJECT_PATTERN.test(o);
    return r;
  },
  validZdIdFormat: function(n) {
    var r = this.resources.ZD_ID_FORMAT_PATTERN.test(n);
    return r;
  },
  getArray: function(a) {
    var arr = [];

    for (var i = 0; i < a.articles.length; i++) {
      var o = {
        id: a.articles[i].id,
        url: a.articles[i].html_url,
        name: a.articles[i].name,
        outdated: a.articles[i].outdated
      };
      arr.push(o);
    }
    return arr;
  },
  getSingle: function(id, a) {
    if (typeof id == 'string' || id instanceof String)
      id = parseInt(id);
    var i = _.findIndex(a.articles, {
      id: id
    });
    return a.articles[i];
  },
  getName: function(id, a) {
    if (a.articles instanceof Array) {
      var i = _.findIndex(a.articles, {
        id: id
      });
      return a.articles[i]["name"];
    } else {
      return a.name;
    }

  },
  getTitle: function(id, a) {
    if (a.articles instanceof Array) {
      var i = _.findIndex(a.articles, {
        id: id
      });
      return a.articles[i]["title"];
    } else {
      return a.title;
    }
  },
  getBody: function(id, a) {
    if (a.articles instanceof Array) {
      var i = _.findIndex(a.articles, {
        id: id
      });
      return a.articles[i]["body"];
    } else {
      return a.body;
    }
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
  },
  key: 'articles',

  init: function(a, app) {
    app.store(a); // side effect
    return true;
  },
  getRaw: function(app) {
    return app.store(key);
  },
  getSerialized: function(app) {
    return JSON.stringify(app.store(key));
  },
  getHtml: function(app) {
    return JSON.stringify(app.store(key));
  }
};
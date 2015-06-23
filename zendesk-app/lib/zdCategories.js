var syncUtil = require('syncUtil');

module.exports = {
  resources: {
    ZD_OBJECT_PATTERN: /(articles|sections|categories)/,
    ZD_ID_FORMAT_PATTERN: /^\d+$/,
    STRING_RADIX : 10
  },

    mapSyncPage: function(categories, languages, project) {
    var arr = [];
    for (var i = 0; i < categories.length; i++) {
      var tc;
      var li = _.findIndex(languages, {
        id: categories[i].id
      });
      if (li !== -1) { // not not found
        tc = languages[li].locale_completed;
      } else {
        tc = [];
      }

      arr[i] = {
        "name": "categories-" + categories[i].id,
        "zd_object_type": "category",
        "zd_object_id": categories[i].id,
        "zd_object_url": categories[i].url,
        "zd_outdated": categories[i].outdated,
        "tx_resource_url": "https://www.transifex.com/projects/p/" + project + "/resource/categories-" + categories[i].id,
        "tx_completed": tc,
        "title_string": categories[i].name
      };
    }
    return arr;
  },

  getIdList: function(a) {

    var l = a.articles.length;
    var arr = [];
    for (var i = 0; i < l; i++) {
      arr[i] = a.articles[i].id;
    }
    return arr;
  },

  getTxRequest: function(c) { 
    var arr = [];
    var ret = [];
    if (c.categories instanceof Array) {
      arr = this.getIdList(c);
    } else {
      arr[0] = c.id;
    }


    for (var i = 0; i < arr.length; i++) {
      var req = {
        name: this.createResourceName(arr[i], 'categories', '-'),
        slug: this.createResourceName(arr[i], 'categories', '-'),
        priority: 0,
        i18n_type: 'KEYVALUEJSON'
      };


      var o = {};
      var o1 = syncUtil.addString('name', this.getName(arr[i], c), o);
           var o2 = {};
      if (this.getDescription(arr[i], c) !== "") {
        o2 = syncUtil.addString('description', this.getDescription(arr[i], c), o1);
      } else {
        o2 = o1;
      }
      var o4 = syncUtil.addContent(req, o2);
      ret[i] = o4;
    }
    if (c.categories instanceof Array) {
      return ret;
    } else {
      return ret[0];
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
  getArray: function(c) {
    var arr = [];
    for (var i = 0; i < c.categories.length; i++) {
      var o = {
        id: c.categories[i].id,
        url: c.categories[i].html_url,
        name: c.categories[i].name,
        outdated: c.categories[i].outdated
      };
      arr.push(o);
    }
    return arr;
  },
  getSingle: function(id, c) {
    if (typeof id == 'string' || id instanceof String)
      id = parseInt(id,this.resources.STRING_RADIX);
    var i = _.findIndex(c.categories, {
      id: id
    });
    return c.categories[i];
  },
  getName: function(id, c) {
    if (c.categories instanceof Array) {
      var i = _.findIndex(c.categories, {
        id: id
      });
      return c.categories[i]["name"];
    } else {
      return c.name;
    }

  },
  getTitle: function(id, c) {
    if (c.categories instanceof Array) {
      var i = _.findIndex(c.categories, {
        id: id
      });
      return c.categories[i]["title"];
    } else {
      return c.categories;
    }
  },
  getBody: function(id, c) {
    if (c.categories instanceof Array) {
      var i = _.findIndex(c.categories, {
        id: id
      });
      return c.categories[i]["body"];
    } else {
      return c.body;
    }
  },
      getDescription: function(id, c) {
    if (c.categories instanceof Array) {
      var i = _.findIndex(c.categories, {
        id: id
      });
      return c.categories[i]["categories"];
    } else {
      return c.categories;
    }

  },
  getSourceLocale: function(id, c) {

    var i = _.findIndex(c.categories, {
      id: id
    });
    return c.categories[i]["source_locale"];
  },
  getLocale: function(id, c) {

    var i = _.findIndex(c.categories, {
      id: id
    });
    return c.categories[i]["locale"];
  },
  key: 'categories',

  init: function(c, app) {
    app.store(c); // side effect
    return true;
  },
  getRaw: function(app) {
    return app.store(this.key);
  },
  getSerialized: function(app) {
    return JSON.stringify(app.store(this.key));
  },
  getHtml: function(app) {
    return JSON.stringify(app.store(this.key));
  }
};
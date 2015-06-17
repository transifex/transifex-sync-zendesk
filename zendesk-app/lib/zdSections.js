var syncUtil = require('syncUtil');

module.exports = {
  resources: {
    ZD_OBJECT_PATTERN: /(articles|sections|categories)/,
    ZD_ID_FORMAT_PATTERN: /^\d+$/,
    STRING_RADIX : 10
  },

  mapSyncPage: function(sections, languages, project) {
    var arr = [];
    for (var i = 0; i < sections.length; i++) {
      var tc;
      var li = _.findIndex(languages, {
        id: sections[i].id
      });
      if (li !== -1) { // not not found
        tc = languages[li].locale_completed;
      } else {
        tc = [];
      }

      arr[i] = {
        "name": "sections-" + sections[i].id,
        "zd_object_type": "section",
        "zd_object_id": sections[i].id,
        "zd_object_url": sections[i].url,
        "zd_outdated": sections[i].outdated,
        "tx_resource_url": "https://www.transifex.com/projects/p/" + project + "/resource/sections-" + sections[i].id,
        "tx_completed": tc,
        "title_string": sections[i].name
      };
    }
    return arr;
  },

  getIdList: function(s) {

    var l = s.sections.length;
    var arr = [];
    for (var i = 0; i < l; i++) {
      arr[i] = s.sections[i].id;
    }
    return arr;
  },

  //todo - refactor me
  getTxRequest: function(s) { 
    var arr = [];
    var ret = [];
    if (s.sections instanceof Array) {
      arr = this.getIdList(s);
    } else {
      arr[0] = s.id;
    }


    for (var i = 0; i < arr.length; i++) {
      var req = {
        name: this.createResourceName(arr[i], 'sections', '-'),
        slug: this.createResourceName(arr[i], 'sections', '-'),
        priority: 0,
        i18n_type: 'KEYVALUEJSON'
      };


      var o1 = syncUtil.addString('name', this.getName(arr[i], s), {});
      var o2 = {};
      if (this.getDescription(arr[i], s) !== "") {
        o2 = syncUtil.addString('description', this.getDescription(arr[i], s), o1);
      } else {
        o2 = o1;
      }
      var o4 = syncUtil.addContent(req, o2);
      ret[i] = o4;
    }
    if (s.sections instanceof Array) {
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
  getArray: function(s) {
    var arr = [];

    for (var i = 0; i < s.sections.length; i++) {
      var o = {
        id: s.sections[i].id,
        url: s.sections[i].html_url,
        name: s.sections[i].name,
        outdated: s.sections[i].outdated
      };
      arr.push(o);
    }
    return arr;
  },
  getSingle: function(id, s) {
    if (typeof id == 'string' || id instanceof String)
      id = parseInt(id, this.resources.STRING_RADIX);
    var i = _.findIndex(s.sections, {
      id: id
    });
    return s.sections[i];
  },
  getName: function(id, s) {
    if (s.sections instanceof Array) {
      var i = _.findIndex(s.sections, {
        id: id
      });
      return s.sections[i]["name"];
    } else {
      return s.name;
    }

  },
  getTitle: function(id, s) {
    if (s.sections instanceof Array) {
      var i = _.findIndex(s.sections, {
        id: id
      });
      return s.sections[i]["title"];
    } else {
      return s.title;
    }
  },
  getBody: function(id, s) {
    if (s.sections instanceof Array) {
      var i = _.findIndex(s.sections, {
        id: id
      });
      return s.sections[i]["body"];
    } else {
      return s.body;
    }
  },
    getDescription: function(id, s) {
    if (s.sections instanceof Array) {
      var i = _.findIndex(s.sections, {
        id: id
      });
      return s.sections[i]["description"];
    } else {
      return s.description;
    }

  },
  getSourceLocale: function(id, s) {

    var i = _.findIndex(s.sections, {
      id: id
    });
    return s.sections[i]["source_locale"];
  },
  getLocale: function(id, s) {

    var i = _.findIndex(s.sections, {
      id: id
    });
    return s.sections[i]["locale"];
  },
  key: 'sections',

  init: function(s, app) {
    app.store(s); // side effect
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
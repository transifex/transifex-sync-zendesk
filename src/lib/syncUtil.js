module.exports = {
  resources: {
    PATTERN: /[a-zA-Z0-9]+\.[a-zA-Z0-9]+\.[a-zA-Z0-9]+/,
    ZD_OBJECT_PATTERN: /(articles|sections|categories)/,
    ZD_ID_FORMAT_PATTERN: /^\d+$/,
    TX_SLUG_FORMAT_PATTERN: /^[a-zA-Z0-9_.-]*$/
  },

  // UI Section
  mapSyncPage: function(articles, languages, project) {
    var arr = [];
    for (var i = 0; i < articles.length; i++) {
      var tc;
      var li = _.findIndex(languages, {
        id: articles[i].id
      });
      if (li !== -1) { // not not found
        tc = languages[li].locale_completed;
      } else {
        tc = [];
      }

      arr[i] = {
        "name": "articles-" + articles[i].id,
        "zd_object_type": "article",
        "zd_object_id": articles[i].id,
        "zd_object_url": articles[i].url,
        "zd_outdated": articles[i].outdated,
        "tx_resource_url": project + "articles-" + articles[i].id,
        "tx_completed": tc,
        "title_string": articles[i].name
      };
    }
    return arr;
  },

  getLocalesFromArray: function(resource, array) {
    if (resource && array) {
      var i = _.findIndex(array, {
        name: resource
      });
      if (i !== -1) {
        return array[i].locale_completed;
      } else {
        return [];
      }
    } else {
      return [];
    }
  },

  replaceWithObject: function(s, d, o) {
    var a = s.split(d);
    return a[0] + o[a[1]] + a[2];
  },

  getDomainFromUrl: function(baseURI) {
    // Run regular expression to extract domain url
    var regexResult = this.resources.PATTERN.exec(baseURI);
    return regexResult[0];
  },

  addContent: function(r, c) {
    r['content'] = JSON.stringify(c);
    return r;
  },
  addString: function(k, v, c) {
    c[k] = v;
    return c;

  },
  txLocaletoZd: function(l) {
    return l.toLowerCase().replace('_', '-');
  },

  txGetContentObject: function(r) {
    return JSON.parse(r.content);
  },

  txGetCompletedTranslations: function(resource, stats) {
    var arr = [];
    _.each(stats, function(value, key) {
      var match = (value['completed'] === "100%");
      if (match) {
        arr.push(key);
      }
    });

    return {
      name: resource,
      "locale_completed": arr
    };
  },
  isStringinArray: function(s, arr) {
    return (_.some(arr, function(i) {
      return i == s;
    }));
  },
  validTxSlugFormat: function(s) {
    var r = this.resources.TX_SLUG_FORMAT_PATTERN.test(s);
    return r;
  },
  zdGetTranslationObject: function(t, l) {
    var o = _.extend(JSON.parse(t.content), {
      locale: l
    });
    return {
      "translation": o
    };
  }


};

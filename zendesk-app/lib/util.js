var zdArticles = require('zdArticles');

module.exports = {
  resources: {
    PATTERN: /[a-zA-Z0-9]+\.[a-zA-Z0-9]+\.[a-zA-Z0-9]+/,
    ZD_OBJECT_PATTERN: /(articles|sections|categories)/,
    ZD_ID_FORMAT_PATTERN: /^\d+$/,
    TX_SLUG_FORMAT_PATTERN: /^[a-zA-Z0-9_.-]*$/
  },
  // Params: string,delimiter,object
  // Returns: new string after object lookup
  replaceWithObject: function(s, d, o) {
    var a = s.split(d);
    return a[0] + o[a[1]] + a[2];
  },

  getDomainFromUrl: function(baseURI) {
    // Run regular expression to extract domain url
    var regexResult = this.resources.PATTERN.exec(baseURI);
    return regexResult[0];
  },
  createResourceName: function(zdId, zdObjectType, separator) {
    // Key the resource name to the updated zd object
    if (this.validZdObject(zdObjectType))
      if (this.validZdIdFormat(zdId))
        return zdObjectType.toLowerCase() + separator + zdId;
    throw "util.createResourceName:InvalidParameter";
  },
  addContent: function(r, c) {
    r['content'] = JSON.stringify(c);
    return r;
  },
  addString: function(k, v, c) {
    c[k] = v;
    return c;

  },
  txLocaletoZd: function (l) {
    return l.toLowerCase().replace('_', '-');
  },

  txGetContentObject: function(r) {
    return JSON.parse(r.content);
  },

  txGetCompletedTranslations: function(o) {
      var result = [];
      _.each(o, function (value, key) {
      var match = (value['completed'] === "100%");
      if (match) {
        result.push(key);
      }
    });

    return result;
  },
  txCreateArticleRequests: function(a) {

    var arr = [];
    var l = zdArticles.getIdList(a);
    for (var i = 0; i < l.length; i++) {
      var req = {
        name: this.createResourceName(l[i], 'articles', '-'),
        slug: this.createResourceName(l[i], 'articles', '-'),
        priority: 0,
        i18n_type: 'KEYVALUEJSON'
      };


      var o = {};
      var o1 = this.addString('name', zdArticles.getName(l[i], a), o);
      var o2 = this.addString('title', zdArticles.getTitle(l[i], a), o1);
      var o3 = this.addString('body', zdArticles.getBody(l[i], a), o2);
      var o4 = this.addContent(req, o3);
      arr[i] = o4;
    }
    return arr;

  },
  isStringinArray: function(s,arr) {
    return (_.some(arr, function(i) { return i == s}));
  },
  validZdObject: function(o) {
    var r = this.resources.ZD_OBJECT_PATTERN.test(o);
    return r;
  },
  validZdIdFormat: function(n) {
    var r = this.resources.ZD_ID_FORMAT_PATTERN.test(n);
    return r;
  },
  validTxSlugFormat: function(s) {
    var r = this.resources.TX_SLUG_FORMAT_PATTERN.test(s);
    return r;
  },
  zdGetTranslationObject: function(t,l){
    var o = _.extend(JSON.parse(t.content),{locale:l});
    return {"translation": o };
  }


};
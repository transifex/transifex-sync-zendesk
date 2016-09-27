/**
 * Sync utilities
 * @module syncUtil
 */


module.exports = {
  resources: {
    PATTERN: /[a-zA-Z0-9]+\.[a-zA-Z0-9]+\.[a-zA-Z0-9]+/,
    ZD_OBJECT_PATTERN: /(articles|sections|categories)/,
    ZD_ID_FORMAT_PATTERN: /^\d+$/,
    TX_SLUG_FORMAT_PATTERN: /^[a-zA-Z0-9_.-]*$/
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

  isStringinArray: function(s, arr) {
    return (_.some(arr, function(i) {
      return i == s;
    }));
  },

  validTxSlugFormat: function(s) {
    var r = this.resources.TX_SLUG_FORMAT_PATTERN.test(s);
    return r;
  },

  zdGetTranslationObject: function(content, l) {
    var o = _.extend(JSON.parse(content), {
      locale: l
    });
    return {
      "translation": o
    };
  }
};

module.exports = {
  resources: {
    STRING_RADIX : 10
  },

  getLocale: function(t) {
    var arr = t.translations;
    return _.pluck(arr, 'locale');
  },

  getStatus: function(t, id, l) {
    var arr = t.translations;
    if (typeof id == 'string' || id instanceof String)
      id = parseInt(id,this.resources.STRING_RADIX);

    var i = _.findIndex(arr, {
      source_id: id,
      locale: l
    });
    var ret = [];
    ret[0] = {
      "outdated": arr[i].outdated
    };
    ret[1] = {
      "draft": arr[i].draft
    };
    ret[2] = {
      "hidden": arr[i].hidden
    };
    return ret;
  }
};
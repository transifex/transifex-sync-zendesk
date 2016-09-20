/**
 * Common storage for modules to communicate
 * @module io
 */

var SETTINGS = {},
    FEATURES = {},
    SORTING = {
      sortby: 'title',
      sortdirection: 'asc',
      perpage: '10',
    },
    OP = {},
    PAGE_ERROR = '',
    SYNC_STATUS = [];

module.exports = {
  setSettings: function(settings) {
    SETTINGS = settings;
  },
  getSettings: function() {
    return SETTINGS;
  },

  setFeatures: function(features) {
    FEATURES = features;
  },
  hasFeature: function(feature) {
    return FEATURES[feature] !== undefined;
  },
  getFeature: function(feature) {
    return FEATURES[feature];
  },

  pushSync: function(key) {
    SYNC_STATUS.push(key);
  },
  popSync: function(key) {
    SYNC_STATUS = _.without(SYNC_STATUS, key);
  },
  isSync: function(key) {
    return _.contains(SYNC_STATUS, key);
  },
  syncLength: function() {
    return SYNC_STATUS.length;
  },

  setSorting: function(obj) {
    SORTING = obj;
  },
  getSorting: function() {
    return SORTING || {};
  },

  setPageError: function(error) {
    PAGE_ERROR = error || '';
  },
  getPageError: function() {
    return PAGE_ERROR;
  },

  opResetAll: function() {
    OP = {};
  },
  opSet: function(key, status) {
    OP[key] = status;
  },
  opGet: function(key) {
    return OP[key];
  },
  opGetAll: function() {
    return OP;
  }

};

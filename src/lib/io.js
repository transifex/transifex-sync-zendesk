/**
 * Common storage for modules to communicate
 * @module io
 */

var SETTINGS = {},
    FEATURES = {},
    SORTING = {
      sortby: '',
      sortdirection: '',
      perpage: '10',
    },
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
};

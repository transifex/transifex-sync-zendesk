/**
 * Common storage for modules to communicate
 * @module io
 */

var SETTINGS = {},
    FEATURES = {'html-tx-resource': true},
    SORTING = {
      sortby: 'title',
      sortdirection: 'asc',
      perpage: '10',
    },
    OP = {},
    PAGE_ERROR = '',
    SYNC_STATUS = [],
    RETRIES = {},
    ZD_LOCALES = {},
    RESOURCE_ARRAY = [],
    QUERY = '';

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

  getRetries: function(key){
    return RETRIES[key] || 0;
  },
  setRetries: function(key, value){
    RETRIES[key] = value;
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
  },
  getLocales: function() {
    return _.map(ZD_LOCALES, function(l){
      return l['locale'].toLowerCase();
    });
  },
  getLocalesObj: function() {
    return ZD_LOCALES;
  },
  setLocales: function(locales) {
    ZD_LOCALES = locales;
  },
  getLocaleFromId: function(id) {
    return _.find(ZD_LOCALES, function(l){
      return l['id'] === id;
    })['locale'];
  },
  getIdFromLocale: function(locale) {
    return _.find(ZD_LOCALES, function(l){
      return l['locale'].toLowerCase() == locale;
    })['id'];
  },
  getResourceArray: function() {
    return RESOURCE_ARRAY;
  },
  setResourceArray: function(arr) {
    RESOURCE_ARRAY = arr;
  },
  pushResource: function(slug) {
    RESOURCE_ARRAY.push(slug);
  },
  getQuery: function() {
    return QUERY;
  },
  setQuery: function(q) {
    QUERY = q;
  },
};

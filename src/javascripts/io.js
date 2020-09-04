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
    ZD_USER_EMAIL = '',
    QUERY = '',
    RENAMES = {
      done: 0,
      failed: 0,
    };

module.exports = {
  setSettings: settings => {
    SETTINGS = settings;
  },
  getSettings: () => SETTINGS,

  setEmail: email => {
    ZD_USER_EMAIL = email;
  },
  getEmail: () => ZD_USER_EMAIL,
  setFeatures: features => {
    FEATURES = features;
  },
  hasFeature: feature => FEATURES[feature] !== undefined,
  getFeature: feature => FEATURES[feature],

  pushSync: key => {
    SYNC_STATUS.push(key);
  },
  popSync: key => {
    SYNC_STATUS = _.without(SYNC_STATUS, key);
  },
  isSync: key => _.contains(SYNC_STATUS, key),
  syncLength: () => SYNC_STATUS.length,

  setSorting: obj => {
    SORTING = obj;
  },
  getSorting: () => SORTING || {},

  getRetries: key => RETRIES[key] || 0,
  setRetries: (key, value) => {
    RETRIES[key] = value;
  },

  setPageError: error => {
    PAGE_ERROR = error || '';
  },
  getPageError: () => PAGE_ERROR,

  opResetAll: () => {
    OP = {};
  },
  opSet: (key, status) => {
    OP[key] = status;
  },
  opGet: key => OP[key],
  opGetAll: () => OP,
  getLocales: () => _.map(ZD_LOCALES, l => l['locale'].toLowerCase()),
  getLocalesObj: () => ZD_LOCALES,
  setLocales: locales => {
    ZD_LOCALES = _.map(locales, l => {
      l.locale = l.locale.toLowerCase();
      return l;
    });
  },
  extendLocales: locales => {
    var extraLocales = _.map(locales, l => {
      l.locale = l.locale.toLowerCase();
      return l;
    });
    ZD_LOCALES = _.uniq(_.union(ZD_LOCALES, extraLocales), x => x.locale);
  },
  getLocaleFromId: id => _.find(ZD_LOCALES, l => l['id'] === id)['locale'],
  getIdFromLocale: locale => _.find(ZD_LOCALES, l => l['locale'].toLowerCase() == locale)['id'],
  getResourceArray: () => RESOURCE_ARRAY,
  setResourceArray: arr => {
    RESOURCE_ARRAY = arr;
  },
  pushResource: slug => {
    RESOURCE_ARRAY.push(slug);
  },
  getQuery: () => QUERY,
  setQuery: q => {
    QUERY = q;
  },

  renameDone: () => {
    RENAMES['done']++;
  },
  renameFailed: () => {
    RENAMES['failed']++;
  },
  getRenames: () => RENAMES,
  clearRenames: () => {
    RENAMES = {
      done: 0,
      failed: 0,
    };
  },
};

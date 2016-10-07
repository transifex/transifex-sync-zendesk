var common = require('../common'),
    io = require('../io'),
    logger = require('../logger');

var config = module.exports = {
  // selfies
  base_url: '/api/v2/',
  key: 'zd_config',
  events: {
    'activatedLocales.done': 'activatedLocalesDone',
    'activatedLocales.fail': 'activatedLocalesFail',
    'currentLocale.done': 'currentLocaleDone',
    'currentLocale.fail': 'currentLocaleFail',
  },
  requests: {
    activatedLocales: function() {
      logger.debug('Retrieving activated locales for account');
      return {
        url: config.base_url + 'locales/public.json',
        type: 'GET',
        dataType: 'json',
      };
    },
    currentLocale: function() {
      logger.debug('Retrieving activated locales for account');
      return {
        url: config.base_url + 'locales/current.json',
        type: 'GET',
        dataType: 'json',
      };
    },
  },
  eventHandlers: {
    activatedLocalesDone: function(data, textStatus, jqXHR) {
      var locales = [];
      logger.info('Activated Locales Retrieved with status:', textStatus);
      _.map(data['locales'], function(l){
        locales.push(l['locale'].toLowerCase());
      });
      this.store('zd_project_locales', locales);
      io.popSync(config.key + 'activated');
      this.checkAsyncComplete();
    },
    currentLocaleDone: function(data, textStatus, jqXHR) {
      logger.info('Activated Locales Retrieved with status:', textStatus);
      this.store('current_locale', data.locale.locale.toLowerCase());
      io.popSync(config.key + 'current');
      this.checkAsyncComplete();
    },
    currentLocaleFail: function(jqXHR, textStatus) {
      logger.info('Locales Retrieved with status:', textStatus);
      io.popSync(config.key + 'current');
      io.setPageError('zdLocales');
      this.checkAsyncComplete();
    },
    activatedLocalesFail: function(jqXHR, textStatus) {
      logger.info('Locales Retrieved with status:', textStatus);
      io.popSync(config.key + 'activated');
      io.setPageError('zdLocales');
      this.checkAsyncComplete();
    },
  },
  actionHandlers: {
    asyncGetActivatedLocales: function() {
      io.pushSync(config.key + 'activated');
      this.ajax('activatedLocales');
    },
    asyncGetCurrentLocale: function() {
      io.pushSync(config.key + 'current');
      this.ajax('currentLocale');
    },
  }
};

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
    'defaultLocale.done': 'defaultLocaleDone',
    'defaultLocale.fail': 'defaultLocaleFail',
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
    defaultLocale: function() {
      logger.debug('Retrieving activated locales for account');
      return {
        url: config.base_url + 'locales.json',
        type: 'GET',
        dataType: 'json',
      };
    },
  },
  eventHandlers: {
    activatedLocalesDone: function(data, textStatus, jqXHR) {
      logger.info('Activated Locales Retrieved with status:', textStatus);
      io.setLocales(data.locales);
      io.popSync(config.key + 'activated');
      this.checkAsyncComplete();
    },
    defaultLocaleDone: function(data, textStatus, jqXHR) {
      logger.info('Activated Locales Retrieved with status:', textStatus);
      var locale = _.find(data['locales'], function(l){
        return l.default;
      });
      this.store('project_locales', _.map(data.locales, function (locale) {
        return locale.locale.toLowerCase();
      }));
      this.store('default_locale', locale.locale.toLowerCase());
      io.popSync(config.key + 'default');
      this.checkAsyncComplete();
    },
    defaultLocaleFail: function(jqXHR, textStatus) {
      logger.info('Locales Retrieved with status:', textStatus);
      io.popSync(config.key + 'default');
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
      io.pushSync(config.key + 'default');
      this.ajax('defaultLocale');
    },
  }
};

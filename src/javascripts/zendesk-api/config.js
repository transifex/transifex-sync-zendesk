var common = require('../common'),
    io = require('../io'),
    logger = require('../logger');

var config = module.exports = {
  // selfies
  base_url: '/api/v2/',
  key: 'zd_config',
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
    activatedLocalesDone: function(data) {
      logger.info('Activated Locales Retrieved with status:', 'OK');
      io.setLocales(data.locales);
      io.popSync(config.key + 'activated');
      this.checkAsyncComplete();
    },
    defaultLocaleDone: function(data) {
      logger.info('Activated Locales Retrieved with status:', 'OK');
      var locale = _.find(data['locales'], l => l.default);
      this.store('project_locales', _.map(data.locales, function (locale) {
        return locale.locale.toLowerCase();
      }));
      this.store('default_locale', locale.locale.toLowerCase());
      io.popSync(config.key + 'default');
      this.checkAsyncComplete();
    },
    defaultLocaleFail: function(jqXHR) {
      logger.info('Locales Retrieved with status:', jqXHR.statusText);
      io.popSync(config.key + 'default');
      io.setPageError('zdLocales');
      this.checkAsyncComplete();
    },
    activatedLocalesFail: function(jqXHR) {
      logger.info('Locales Retrieved with status:', jqXHR.statusText);
      io.popSync(config.key + 'activated');
      io.setPageError('zdLocales');
      this.checkAsyncComplete();
    },
  },
  actionHandlers: {
    asyncGetActivatedLocales: function() {
      io.pushSync(config.key + 'activated');
      this.ajax('activatedLocales')
        .done(data => {
          this.activatedLocalesDone(data);
        })
        .fail(xhr => {
          this.activatedLocalesFail(xhr);
        });
    },
    asyncGetCurrentLocale: function() {
      io.pushSync(config.key + 'default');
      this.ajax('defaultLocale')
        .done(data => {
          this.defaultLocaleDone(data);
        })
        .fail(xhr => {
          this.defaultLocaleFail(xhr);
        });
    },
  }
};

var common = require('../common'),
    io = require('../io'),
    logger = require('../logger');

var config = module.exports = {
  // selfies
  base_url: '/api/v2/help_center/',
  key: 'zd_config',
  events: {
    'activatedLocales.done': 'activatedLocalesDone',
    'activatedLocales.fail': 'activatedLocalesFail'
  },
  requests: {
    activatedLocales: function() {
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
      this.store('zd_project_locales', data['locales']);
      io.popSync(config.key);
      this.checkAsyncComplete();
    },
    activatedLocalesFail: function(jqXHR, textStatus) {
      logger.info('Activated Locales Retrieved with status:', textStatus);
      io.popSync(config.key);
      io.setPageError('zdLocales');
      this.checkAsyncComplete();
    },
  },
  actionHandlers: {
    asyncGetActivatedLocales: function() {
      io.pushSync(config.key);
      this.ajax('activatedLocales');
    },
  }
};

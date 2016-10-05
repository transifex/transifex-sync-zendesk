var common = require('../common'),
    io = require('../io'),
    logger = require('../logger');

var dynamic_content = module.exports = {
  // selfies
  base_url: '/api/v2/dynamic_content/',
  key: 'zd_dynamic_content',
  api: 'items',
  events: {
    'dynamicContentItems.done': 'dynamicContentItemsDone',
    'dynamicContentItems.fail': 'dynamicContentItemsFail',
  },
  requests: {
    dynamicContentItems: function() {
      logger.debug('Retrieving dynamic content items for account');
      return {
        url: dynamic_content.base_url + 'items.json',
        type: 'GET',
        dataType: 'json',
      };
    },
  },
  eventHandlers: {
    dynamicContentItemsDone: function(data, textStatus, jqXHR) {
      var locales = [];
      logger.info('Dynamic content retrieved with status:', textStatus);
      //map name to title
      if (data) {
        _.each(data.items, function(entry) {
          entry.title = entry.name;
        });
      }
      this.store(dynamic_content.key, data);
      io.popSync(dynamic_content.key);
      this.checkAsyncComplete();
    },
    dynamicContentItemsFail: function(jqXHR, textStatus) {
      logger.info('Dynamic content retrieved with status:', textStatus);
      io.popSync(dynamic_content.key);
      io.setPageError('dynamicContent');
      this.checkAsyncComplete();
    },
  },
  actionHandlers: {
    asyncGetZdDynamicContentFull: function() {
      io.pushSync(dynamic_content.key);
      this.ajax('dynamicContentItems');
    },
    getDynamicContentForTranslation: function(entry){
      return {
        resource_name: entry.resource_name,
        body: _.filter(entry.variants, function(v){
          return v.default;
        }).content
      };
    },
  },
  helpers: {
    calcResourceNameDynamicContent: function(obj) {
      var ret = obj[dynamic_content.api],
          type = dynamic_content.api,
          response = {};
      if (io.getFeature('html-tx-resource')) {
        type = 'HTML-' + type;
      }
      var typeString = type + '-';
      // Get the array key and use it as a type
      var limit = obj[dynamic_content.api].length;
      for (var i = 0; i < limit; i++) {
        ret[i] = _.extend(ret[i], {
          resource_name: typeString + ret[i].id
        });
      }
      response[dynamic_content.api] = ret;
      return response;
    },
  }
};

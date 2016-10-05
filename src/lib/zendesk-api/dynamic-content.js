var common = require('../common'),
    io = require('../io'),
    logger = require('../logger'),
    syncUtil = require('../syncUtil'),
    txProject = require('transifex-api/project'),
    txResource = require('transifex-api/resource');

var dynamic_content = module.exports = {
  // selfies
  base_url: '/api/v2/dynamic_content/',
  key: 'zd_dynamic_content',
  api: 'items',
  events: {
    'dynamicContentItems.done': 'dynamicContentItemsDone',
    'dynamicContentItems.fail': 'dynamicContentItemsFail',
    'variantsInsert.done': 'variantsInsertDone',
    'variantsInsert.fail': 'variantsFail',
    'variantsUpdate.done': 'variantsUpdateDone',
    'variantsUpdate.fail': 'variantsFail',
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
    variantsInsert: function(data, id) {
      io.pushSync(dynamic_content.key + 'insert' + id);
      return {
        url: dynamic_content.base_url + 'items/' + id + '/variants/create_many.json',
        type: 'POST',
        data: JSON.stringify(data),
        beforeSend: function(jqxhr, settings) {
          jqxhr.id = id;
        },
        contentType: 'application/json'
      };
    },
    variantsUpdate: function(data, id) {
      io.pushSync(dynamic_content.key + 'update' + id);
      return {
        url: dynamic_content.base_url + 'items/' + id + '/variants/update_many.json',
        type: 'PUT',
        data: JSON.stringify(data),
        beforeSend: function(jqxhr, settings) {
          jqxhr.id = id;
        },
        contentType: 'application/json'
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
    variantsInsertDone: function(data, textStatus, jqXHR) {
      var locales = [];
      logger.info('DC variants inserted with status:', textStatus);
      //map name to title
      io.popSync(dynamic_content.key + 'insert' + jqXHR.id);
      this.checkAsyncComplete();
    },
    variantsUpdateDone: function(data, textStatus, jqXHR) {
      var locales = [];
      logger.info('DC variants updated with status:', textStatus);
      //map name to title
      if (data) {
        _.each(data.items, function(entry) {
          entry.title = entry.name;
        });
      }
      io.popSync(dynamic_content.key + 'update' + jqXHR.id);
      this.checkAsyncComplete();
    },
  },
  actionHandlers: {
    zdUpsertDynamicContentTranslations: function(entry) {
      logger.info('Upsert Dynamic Content with Id:' + entry.id);
      var new_trans = [], existing = [],
          translation_data, zd_locale,
          project = this.store(txProject.key),
          existing_locales = this.store(dynamic_content.key + entry.id + '_locales'),
          resource = this.store(txResource.key + entry.resource_name),
          tx_completed = this.completedLanguages(resource),
          sourceLocale = this.getSourceLocale(project),
          locales_list = this.store('zd_project_locales');

      for (var i = 0; i < tx_completed.length; i++) {
        if (sourceLocale !== tx_completed[i]) { // skip the source locale
          translation_data = this.store(txResource.key + entry.resource_name + tx_completed[i]);
          translation_data = common.translationObjectFormat(translation_data.content);
          zd_locale = syncUtil.txLocaletoZd(tx_completed[i]);
          if (syncUtil.isStringinArray(zd_locale, existing_locales)){
            existing.push({
              content: translation_data.translation.body,
              locale_id: syncUtil.mapLocaleToId(zd_locale, locales_list),
            });
          } else {
            new_trans.push({
              content: translation_data.translation.body,
              locale_id: syncUtil.mapLocaleToId(zd_locale, locales_list),
            });
          }
        }
      }
      if (new_trans.length) {
        this.ajax('variantsInsert', {'variants': new_trans}, entry.id);
      }
      if (existing.length) {
        this.ajax('variantsUpdate', {'variants': existing}, entry.id);
      }
    },

    asyncGetZdDynamicContentFull: function() {
      io.pushSync(dynamic_content.key);
      this.ajax('dynamicContentItems');
    },
    getDynamicContentForTranslation: function(entry){
      return {
        resource_name: entry.resource_name,
        body: _.filter(entry.variants, function(v){
          return v.default;
        })[0].content,
        title: '',
        name: '',
      };
    },
    asyncGetZdDynamicContentTranslations: function(id) {
      return;
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

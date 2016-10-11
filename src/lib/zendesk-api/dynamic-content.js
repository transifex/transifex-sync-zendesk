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
  label: 'dynamic',
  events: {
    'dynamicContentItems.done': 'dynamicContentItemsDone',
    'dynamicContentItems.fail': 'dynamicContentItemsFail',
    'variantsInsert.done': 'variantsInsertDone',
    'variantsInsert.fail': 'variantsInsertFail',
    'variantsUpdate.done': 'variantsUpdateDone',
    'variantsUpdate.fail': 'variantsUpdateFail',
  },
  requests: {
    dynamicContentItems: function(page, sortby, sortdirection, numperpage) {
      logger.debug('Retrieving dynamic content items for account');
      var numberperpageString = "";
      if (numperpage) {
        numberperpageString = "?per_page=" + numperpage;
      } else {
        numberperpageString = "?per_page=10";
      }

      var pageString = "";
      if (page) {
        pageString = '&page=' + page;
      }

      var sortbyString = "";
      if (sortby) {
        sortbyString = '&sort_by=' + sortby;
      }

      var sortdirectionString = "";
      if (sortdirection) {
        sortdirectionString = '&sort_order=' + sortdirection;
      }
      return {
        url: dynamic_content.base_url + 'items.json' + numberperpageString +
            pageString + sortbyString + sortdirectionString,
        type: 'GET',
        dataType: 'json',
        beforeSend: function(jqxhr, settings) {
          jqxhr.per_page = numperpage;
        },
      };
    },
    variantsInsert: function(data, id, locales) {
      io.pushSync(dynamic_content.key + id + 'insert');
      return {
        url: dynamic_content.base_url + 'items/' + id + '/variants/create_many.json',
        type: 'POST',
        data: JSON.stringify(data),
        beforeSend: function(jqxhr, settings) {
          jqxhr.id = id;
          jqxhr.locales = locales;
        },
        contentType: 'application/json'
      };
    },
    variantsUpdate: function(data, id, locales) {
      io.pushSync(dynamic_content.key + id + 'update');
      return {
        url: dynamic_content.base_url + 'items/' + id + '/variants/update_many.json',
        type: 'PUT',
        data: JSON.stringify(data),
        beforeSend: function(jqxhr, settings) {
          jqxhr.id = id;
          jqxhr.locales = locales;
        },
        contentType: 'application/json'
      };
    },
  },
  eventHandlers: {
    dynamicContentItemsDone: function(data, textStatus, jqXHR) {
      var that = this,
          existing_locales;
      logger.info('Dynamic content retrieved with status:', textStatus);
      //map name to title
      if (data) {
        _.each(data.items, function(entry) {
          entry.title = entry.name;
          existing_locales = _.map(entry.variants, function(v){
            return io.getLocaleFromId(v.locale_id);
          });
          that.store(dynamic_content.key + entry.id + '_locales', existing_locales);
        });
      }
      data.page_count = 1;
      if (data.count > jqXHR.per_page) {
        data.page_count = Math.ceil(data.count / jqXHR.per_page);
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
      logger.info('DC variants inserted with status:', textStatus);
      io.popSync(dynamic_content.key + jqXHR.id + 'insert');
      var existing_locales = this.store(dynamic_content.key + jqXHR.id + '_locales');
      _.each(jqXHR.locales, function(locale){
        io.opSet(jqXHR.id + '_' + locale, textStatus);
        existing_locales.push(locale);
      });
      this.store(dynamic_content.key + jqXHR.id + '_locales', existing_locales);
      this.checkAsyncComplete();
    },
    variantsInsertFail: function(data, textStatus, jqXHR) {
      logger.info('DC variants inserted with status:', textStatus);
      io.popSync(dynamic_content.key + jqXHR.id + 'insert');
      _.each(jqXHR.locales, function(locale){
        io.opSet(jqXHR.id + '_' + locale, textStatus);
      });
      this.checkAsyncComplete();
    },
    variantsUpdateDone: function(data, textStatus, jqXHR) {
      logger.info('DC variants updated with status:', textStatus);
      io.popSync(dynamic_content.key + jqXHR.id + 'update');
      _.each(jqXHR.locales, function(locale){
        io.opSet(jqXHR.id + '_' + locale, textStatus);
      });
      this.checkAsyncComplete();
    },
    variantsUpdateFail: function(data, textStatus, jqXHR) {
      logger.info('DC variants inserted with status:', textStatus);
      io.popSync(dynamic_content.key + jqXHR.id + 'update');
      _.each(jqXHR.locales, function(locale){
        io.opSet(jqXHR.id + '_' + locale, textStatus);
      });
      this.checkAsyncComplete();
    },
  },
  actionHandlers: {
    zdUpsertDynamicContentTranslations: function(entry) {
      logger.info('Upsert Dynamic Content with Id:' + entry.id);
      var new_trans = [], existing = [],
          to_update = [], to_insert = [],
          translation_data, zd_locale,
          project = this.store(txProject.key),
          existing_locales = this.store(dynamic_content.key + entry.id + '_locales'),
          resource = this.store(txResource.key + entry.resource_name),
          tx_completed = this.completedLanguages(resource),
          sourceLocale = this.getSourceLocale(project),
          locales_list = io.getLocales();

      for (var i = 0; i < tx_completed.length; i++) {
        if (sourceLocale !== tx_completed[i]) { // skip the source locale
          translation_data = this.store(txResource.key + entry.resource_name + tx_completed[i]);
          translation_data = common.translationObjectFormat(translation_data.content);
          zd_locale = syncUtil.txLocaletoZd(tx_completed[i]);
          if (syncUtil.isStringinArray(zd_locale, existing_locales)){
            existing.push({
              content: translation_data.translation.body,
              locale_id: io.getIdFromLocale(zd_locale),
            });
            to_update.push(zd_locale);
          } else {
            new_trans.push({
              content: translation_data.translation.body,
              locale_id: io.getIdFromLocale(zd_locale),
            });
            to_insert.push(zd_locale);
          }
        }
      }
      if (new_trans.length) {
        this.ajax('variantsInsert', {'variants': new_trans}, entry.id, to_insert);
      }
      if (existing.length) {
        this.ajax('variantsUpdate', {'variants': existing}, entry.id, to_update);
      }
    },

    asyncGetZdDynamicContentFull: function(page, sortby, sortdirection, numperpage) {
      io.pushSync(dynamic_content.key);
      this.ajax('dynamicContentItems', page, sortby, sortdirection, numperpage);
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
    asyncGetZdDynamicContentTranslations: function(entry_id){
      // not required for dynamic content
      return;
    },
  },
  helpers: {
    calcResourceNameDynamicContent: function(obj) {
      var ret = obj[dynamic_content.api],
          type = dynamic_content.label,
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
      response[dynamic_content.label] = ret;
      return response;
    },
  }
};

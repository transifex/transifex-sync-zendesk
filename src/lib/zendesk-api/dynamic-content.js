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
    'variantInsert.done': 'variantInsertDone',
    'variantInsert.fail': 'variantInsertFail',
    'variantUpdate.done': 'variantUpdateDone',
    'variantUpdate.fail': 'variantUpdateFail',
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
    variantInsert: function(data, id, locale) {
      io.pushSync(dynamic_content.key + id + 'insert' + locale);
      return {
        url: dynamic_content.base_url + 'items/' + id + '/variants.json',
        type: 'POST',
        data: JSON.stringify(data),
        beforeSend: function(jqxhr, settings) {
          jqxhr.id = id;
          jqxhr.locale = locale;
        },
        contentType: 'application/json'
      };
    },
    variantUpdate: function(data, id, locale, variant_id) {
      io.pushSync(dynamic_content.key + id + 'update' + locale);
      return {
        url: dynamic_content.base_url + 'items/' + id + '/variants/' + variant_id + '.json',
        type: 'PUT',
        data: JSON.stringify(data),
        beforeSend: function(jqxhr, settings) {
          jqxhr.id = id;
          jqxhr.locale = locale;
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
      // return nothing if we are not in the default brand
      if (!this.selected_brand.default)
        data = {items: []};
      //map name to title
      if (data) {
        _.each(data.items, function(entry) {
          entry.title = entry.name;
          existing_locales = _.map(entry.variants, function(v){
            return io.getLocaleFromId(v.locale_id).toLowerCase();
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
    variantInsertDone: function(data, textStatus, jqXHR) {
      logger.info('DC variants inserted with status:', textStatus);
      io.popSync(dynamic_content.key + jqXHR.id + 'insert' + jqXHR.locale);
      var existing_locales = this.store(dynamic_content.key + jqXHR.id + '_locales');
      io.opSet(jqXHR.id + '_' + jqXHR.locale, textStatus);
      existing_locales.push(jqXHR.locale);
      this.store(dynamic_content.key + jqXHR.id + '_locales', existing_locales);
      this.checkAsyncComplete();
    },
    variantInsertFail: function(data, textStatus, jqXHR) {
      logger.info('DC variant inserted with status:', textStatus);
      io.popSync(dynamic_content.key + jqXHR.id + 'insert' + jqXHR.locale);
      io.opSet(jqXHR.id + '_' + jqXHR.locale, textStatus);
      this.checkAsyncComplete();
    },
    variantUpdateDone: function(data, textStatus, jqXHR) {
      logger.info('DC variant updated with status:', textStatus);
      io.popSync(dynamic_content.key + jqXHR.id + 'update' + jqXHR.locale);
      io.opSet(jqXHR.id + '_' + jqXHR.locale, textStatus);
      this.checkAsyncComplete();
    },
    variantUpdateFail: function(data, textStatus, jqXHR) {
      logger.info('DC variant inserted with status:', textStatus);
      io.popSync(dynamic_content.key + jqXHR.id + 'update' + jqXHR.locale);
      io.opSet(jqXHR.id + '_' + jqXHR.locale, textStatus);
      this.checkAsyncComplete();
    },
  },
  actionHandlers: {
    zdUpsertDynamicContentTranslation: function(resource_data, entryid, zd_locale) {
      logger.info('Upsert Dynamic Content with Id:' + entryid + 'and locale:' + zd_locale);

      var data, variant, locale_id,
          translation_data = common.translationObjectFormat(this.$, resource_data, zd_locale),
          existing_locales = this.store(dynamic_content.key + entryid + '_locales');
      locale_id = io.getIdFromLocale(zd_locale);
      data = {
        variant: {
          content: translation_data.translation.body,
          locale_id: locale_id
        }
      };
      var entry = _.findWhere(
        this.store(dynamic_content.key)[dynamic_content.api],
        {'id': entryid}
      );
      if (_.contains(existing_locales, zd_locale)) {
        variant = _.find(entry.variants, function(v){
          return v.locale_id == locale_id;
        });
        this.ajax('variantUpdate', data, entryid, zd_locale, variant.id);
      } else {
        this.ajax('variantInsert', data, entryid, zd_locale);
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
        name: entry.name,
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

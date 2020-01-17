import $ from 'jquery';

var common = require('../common'),
    io = require('../io'),
    logger = require('../logger'),
    syncUtil = require('../syncUtil'),
    txProject = require('../transifex-api/project'),
    txResource = require('../transifex-api/resource');

var dynamic_content = module.exports = {
  // selfies
  base_url: '/api/v2/dynamic_content/',
  key: 'zd_dynamic_content',
  api: 'items',
  label: 'dynamic',
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
      };
    },
    variantInsert: function(data, id, locale) {
      io.pushSync(dynamic_content.key + id + 'insert' + locale);
      return {
        url: dynamic_content.base_url + 'items/' + id + '/variants.json',
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json'
      };
    },
    variantUpdate: function(data, id, locale, variant_id) {
      io.pushSync(dynamic_content.key + id + 'update' + locale);
      return {
        url: dynamic_content.base_url + 'items/' + id + '/variants/' + variant_id + '.json',
        type: 'PUT',
        data: JSON.stringify(data),
        contentType: 'application/json'
      };
    },
  },
  eventHandlers: {
    dynamicContentItemsDone: function(data, per_page) {
      var that = this,
          existing_locales;
      logger.info('Dynamic content retrieved with status:', 'OK');
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
      if (data.count > per_page) {
        data.page_count = Math.ceil(data.count / per_page);
      }
      this.store(dynamic_content.key, data);
      io.popSync(dynamic_content.key);
      this.checkAsyncComplete();
    },
    dynamicContentItemsFail: function(jqXHR) {
      logger.info('Dynamic content retrieved with status:', jqXHR.statusText);
      io.popSync(dynamic_content.key);
      io.setPageError('dynamicContent');
      this.checkAsyncComplete();
    },
    variantInsertDone: function(data, entryid, locale) {
      logger.info('DC variants inserted with status:', 'OK');
      io.popSync(dynamic_content.key + entryid + 'insert' + locale);
      var existing_locales = this.store(dynamic_content.key + entryid + '_locales');
      io.opSet(entryid + '_' + locale, 'success');
      existing_locales.push(locale);
      this.store(dynamic_content.key + entryid + '_locales', existing_locales);
      this.checkAsyncComplete();
      this.zdUpsertTranslationNext();
    },
    variantInsertFail: function(jqXHR, entryid, locale) {
      logger.info('DC variant inserted with status:', jqXHR.statusText);
      io.popSync(dynamic_content.key + entryid + 'insert' + locale);
      io.opSet(entryid + '_' + locale, jqXHR.statusText);
      this.checkAsyncComplete();
      this.zdUpsertTranslationNext();
    },
    variantUpdateDone: function(data, entryid, locale) {
      logger.info('DC variant updated with status:', 'OK');
      io.popSync(dynamic_content.key + entryid + 'update' + locale);
      io.opSet(entryid + '_' + locale, 'success');
      this.checkAsyncComplete();
      this.zdUpsertTranslationNext();
    },
    variantUpdateFail: function(jqXHR, entryid, locale) {
      logger.info('DC variant inserted with status:', jqXHR.statusText);
      io.popSync(dynamic_content.key + entryid + 'update' + locale);
      io.opSet(entryid + '_' + locale, jqXHR.statusText);
      this.checkAsyncComplete();
      this.zdUpsertTranslationNext();
    },
  },
  actionHandlers: {
    zdUpsertDynamicContentTranslation: function(resource_data, entryid, zd_locale) {
      logger.info('Upsert Dynamic Content with Id:' + entryid + ' and locale:' + zd_locale);

      var data, variant, locale_id,
          translation_data = common.translationObjectFormat(resource_data, zd_locale),
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
        variant = _.find(
          entry.variants,
          variant => variant.locale_id == locale_id
        );
        if (_.isUndefined(variant)) {
          this.variantUpdateFail({statusText: 'No variant'}, entryid, zd_locale);
        }
        this.ajax('variantUpdate', data, entryid, zd_locale, variant.id)
          .done(data => this.variantUpdateDone(data, entryid, zd_locale))
          .fail(xhr => this.variantUpdateFail(xhr, entryid, zd_locale));
      } else {
        this.ajax('variantInsert', data, entryid, zd_locale)
          .done(data => this.variantInsertDone(data, entryid, zd_locale))
          .fail(xhr => this.variantInsertFail(xhr, entryid, zd_locale));
      }
    },

    asyncGetZdDynamicContentFull: function(page, sortby, sortdirection, numperpage) {
      io.pushSync(dynamic_content.key);
      this.ajax('dynamicContentItems', page, sortby, sortdirection, numperpage)
        .done(data => this.dynamicContentItemsDone(data, numperpage))
        .fail(xhr => this.dynamicContentItemsFail(xhr));
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

/**
 * The Zendesk resource API gets category data
 * from an existing project.
 * @module zendesk-api/categories
 */

var common = require('../common'),
    io = require('../io'),
    logger = require('../logger');

var category = module.exports = {
  // selfies
  key: 'zd_category',
  base_url: '/api/v2/help_center/',
  timeout: 500,
  STRING_RADIX: 10,
  events: {
    'zdCategories.done': 'zdCategoriesDone',
    'zdCategoriesFull.done': 'zdCategoriesDone',
    'zdCategoryGetTranslations.done': 'zdCategoryGetTranslationsDone',
    'zdCategoryUpdate.done': 'zdCategoryUpdateDone',
    'zdCategoryInsert.done': 'zdCategoryInsertDone',
    'zdCategoryGetTranslations.fail': 'zdCategorySyncError',
    'zdCategories.fail': 'zdCategorySyncError',
    'zdCategoriesFull.fail': 'zdCategorySyncError',
  },
  requests: {
    zdCategories: function() {
      return {
        url: category.base_url + 'categories.json' + "?per_page=7",
        type: 'GET',
        dataType: 'json'
      };
    },
    zdCategoriesFull: function(page, sortby, sortdirection, numperpage) {
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
        url: category.base_url + 'en-us/categories.json' + numberperpageString +
          pageString + sortbyString + sortdirectionString,
        type: 'GET',
        dataType: 'json'
      };
    },
    zdCategoriesSLTranslations: function() {
      return {
        url: category.base_url + '/categories.json?include=translations',
        type: 'GET',
        dataType: 'json'
      };
    },
    zdCategoryGetTranslations: function(id) {
      return {
        url: category.base_url + 'categories/' + id + '/translations',
        type: 'GET',
        beforeSend: function(jqxhr, settings) {
          jqxhr.id = id;
        },
        contentType: 'application/json'
      };
    },
    zdCategoryInsert: function(data, categoryId) {
      return {
        url: category.base_url + 'categories/' + categoryId +
          '/translations.json',
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json'
      };
    },
    zdCategoryUpdate: function(data, id, locale) {
      return {
        url: category.base_url + 'categories/' + id + '/translations/' +
          locale + '.json',
        type: 'PUT',
        data: JSON.stringify(data),
        contentType: 'application/json'
      };
    },
  },
  eventHandlers: {
    zdCategoriesDone: function(data, textStatus) {
      logger.info('Zendesk Categories retrieved with status:', textStatus);
      this.store(category.key, data);
      logger.debug('done, removing key');
      io.popSync(category.key);
      this.checkAsyncComplete();
    },
    zdCategorySyncError: function(jqXHR, textStatus) {
      logger.info('Zendesk Category Retrieved with status:', textStatus);
      io.popSync(category.key);
      this.checkAsyncComplete();
      //this.uiErrorPageInit();
      if (jqXHR.status === 401) {
        logger.error('zdCategorySyncError', 'Login error');
        //this.updateMessage("txLogin", "error");
      }
    },
    zdCategoryGetTranslationsDone: function(data, textStatus, jqXHR) {
      logger.info('Zendesk Category Translations retrieved with status:', textStatus);
      io.popSync(category.key + jqXHR.id);
      this.checkAsyncComplete();
    },
    zdCategoryInsertDone: function(data, textStatus) {
      logger.info('Transifex Resource inserted with status:', textStatus);
    },
    zdCategoryUpdateDone: function(data, textStatus) {
      logger.info('Transifex Resource updated with status:', textStatus);
    },
  },
  actionHandlers: {
    displayCategories: function() {
      var pageData = this.store(category.key);
      pageData = [pageData];
      this.switchTo('sync_categories', {
        dataset: pageData,
      });
    },
    zdUpsertCategoryTranslation: function(resource_data, category_id, zdLocale) {
      logger.info('Upsert Category with Id:' + category_id + 'and locale:' + zdLocale);

      /* var localeRegion = zdLocale.split('-');
       if (localeRegion.length > 1 && localeRegion[0] == localeRegion[1]) {
         zdLocale = localeRegion[0];
       }
       */
      var translationData;
      if (io.hasFeature('html-tx-resource')) {
        translationData = common.translationObjectFormat('html-tx-resource',
          resource_data, zdLocale);
      } else {
        translationData = common.translationObjectFormat('',
          resource_data, zdLocale);
      }
      /*
      var i = _.findIndex(locales, {
        id: parseInt(category_id, 10)
      });
      */
      var translations = this.store(category.key + category_id);
      var checkLocaleExists = (typeof translations[zdLocale] ===
        'undefined') ? false : true;
      if (checkLocaleExists) {
        this.ajax('zdCategoryUpdate', translationData, category_id, zdLocale);
      } else {
        this.ajax('zdCategoryInsert', translationData, category_id);
      }
    },
    asyncGetZdCategories: function() {
      logger.debug('function: [asyncGetZdCategories]');
      io.pushSync(category.key);
      var that = this;
      setTimeout(
        function() {
          that.ajax('zdCategories');
        }, category.timeout);
    },
    asyncGetZdCategoryTranslations: function(id) {
      logger.debug('function: [asyncGetZdCategoryTranslation]');
      io.pushSync(category.key + id);
      var that = this;
      setTimeout(
        function() {
          that.ajax('zdCategoryGetTranslations', id);
        }, category.timeout);
    },
    asyncGetZdCategoriesFull: function(page, sortby, sortdirection, numperpage) {
      logger.debug('function: [asyncGetZdCategoriesFull] params: [page]' +
        page + '[sortby]' + sortby + '[sortdirection]' + sortdirection +
        '[numperpage]' + numperpage);
      io.pushSync(category.key);
      var that = this;
      setTimeout(
        function() {
          that.ajax('zdCategoriesFull', page, sortby, sortdirection,
            numperpage);
        }, category.timeout);
    },

  },
  jsonHandlers: {
    getSingleCategory: function(id, a) {
      if (typeof id == 'string' || id instanceof String)
        id = parseInt(id, category.STRING_RADIX);
      var i = _.findIndex(a.categories, {
        id: id
      });
      return a.categories[i];
    },
    calcResourceNameCategory: function(obj) {
      var ret = obj.categories;
      var type = 'categories';
      if (io.hasFeature('html-tx-resource')) {
        type = 'HTML-' + type;
      }
      var typeString = type + '-';
      // Get the array key and use it as a type
      var limit = obj.categories.length;
      for (var i = 0; i < limit; i++) {
        ret[i] = _.extend(ret[i], {
          resource_name: typeString + ret[i].id
        });
      }
      return {
        categories: ret
      };
    },
    getNameCategory: function(id, a) {
      if (a.categories instanceof Array) {
        var i = _.findIndex(a.categories, {
          id: id
        });
        return a.categories[i]["name"];
      } else {
        return a.name;
      }

    },
    getTitleCategory: function(id, a) {
      if (a.categories instanceof Array) {
        var i = _.findIndex(a.categories, {
          id: id
        });
        return a.categories[i]["title"];
      } else {
        return a.title;
      }
    },
    getBodyCategory: function(id, a) {
      if (a.categories instanceof Array) {
        var i = _.findIndex(a.categories, {
          id: id
        });
        return a.categories[i]["body"];
      } else {
        return a.body;
      }
    },
    checkPaginationCategory: function(a) {
      var i = a.page_count;
      if (typeof i === 'string') {
        i = parseInt(i, 10);
      }
      if (typeof i === 'number') {
        if (i > 1) {
          return true;
        }
      }
      return false;
    },

    getPagesCategory: function(a) {
      var i = a.page_count;
      return _.range(1, i + 1);
    },
    getCurrentPageCategory: function(a) {
      var i = a.page;
      return i;
    },
    isFewerCategory: function(a, i) {
      if (i > 1) {
        return true;
      }
      return false;
    },
    isMoreCategory: function(a, i) {
      if (a.page_count > i) {
        return true;
      }
      return false;
    },
  }
};

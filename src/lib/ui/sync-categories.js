/**
 * Code behind for the sync-page-categories
 * @module ui/sync-categories
 */


var zdCategory = require('../zendesk-api/category'),
    txProject = require('../transifex-api/project'),
    txResource = require('../transifex-api/resource'),
    syncUtil = require('../syncUtil'),
    logger = require('../logger'),
    io = require('../io'),
    common = require('../common');

var syncCategories = module.exports = {
  // selfies
  name: 'sync_page_categories_ui',
  key: 'sync_page_categories',
  sortby: '',
  sortdirection: '',
  perpage: '10',
  currentpage: '1',
  events: {
    'click [tab="categories"]': 'uiCategoriesTab',
    'click .page_action_page': 'uiCategoriesGotoPage',
    'click .page_action_next': 'uiCategoriesNextPage',
    'click .page_action_prev': 'uiCategoriesPrevPage',
    'click .page_action_sort_by_title': 'uiCategoriesSortByTitle',
    'click .page_action_sort_by_updated': 'uiCategoriesSortByUpdated',
    'click [perpage]': 'uiCategoriesPerPage',
    'click .page_action_batch_upload': 'uiCategoriesBatchUpload',
    'click .page_action_batch_download': 'uiCategoriesBatchDownload',
    'click .page_action_sync': 'uiCategoriesSync'
  },
  eventHandlers: {
    uiCategoriesTab: function(event) {
      if (event) event.preventDefault();
      this.currentpage = '1';
      this.uiCategoriesSync();
    },
    uiCategoriesInit: function(event) {
      if (event) event.preventDefault();
      logger.debug('uiCategoriesInit');
      var pageData = this.buildSyncPageCategoriesData();
      this.switchTo('sync_page_categories', {
        dataset: pageData,
      });
      if (syncCategories.sortby === 'updated_at') {
        this.$('#sortby-last-updated').addClass("disabled");
        this.$('#sortby-title').removeClass("disabled");
      }
      if (syncCategories.sortby === 'title') {
        this.$('#sortby-last-updated').removeClass("disabled");
        this.$('#sortby-title').addClass("disabled");
      }
      this.$('[perpage]').removeClass('is-active');
      this.$('[perpage="' + syncCategories.perpage + '"]').addClass('is-active');

      this.loadSyncPage = this.uiCategoriesResourceStatsComplete;
      this.syncResourceStatsCategory();
      this.syncCategoryTranslations();
    },
    uiCategoriesBatchUpload: function(event) {
      if (event) event.preventDefault();
      var categoryData = this.store(zdCategory.key);
      var obj = this.calcResourceNameCategory(categoryData);
      var numCategories = obj.categories.length;
      var category, resource_request, txResourceName;
      for (var i = 0; i < numCategories; i++) {
        category = obj.categories[i];
        txResourceName = category.resource_name;
        resource_request = {};
        if (io.hasFeature('html-tx-resource')) {
          resource_request = common.txRequestHTML(category);
        } else {
          resource_request = common.getTxRequest(category);
        }
        this.loadSyncPage = this.uiCategoriesUpsertComplete;
        io.pushSync(txResource.key + txResourceName + 'upsert');
        this.txUpsertResource(resource_request, txResourceName);
      }
    },
    uiCategoriesBatchDownload: function(event) {
      if (event) event.preventDefault();
      var project = this.store(txProject.key);
      var sourceLocale = txProject.getSourceLocale(project);
      var categoryData = this.store(zdCategory.key);
      var obj = this.calcResourceNameCategory(categoryData);
      var numCategories = obj.categories.length;
      var category, resource, txResourceName, completedLocales;
      var zdLocale, translation;
      for (var i = 0; i < numCategories; i++) {
        category = obj.categories[i];
        txResourceName = category.resource_name;
        resource = this.store(txResource.key + txResourceName);
        completedLocales = this.completedLanguages(resource);

        for (var ii = 0; ii < completedLocales.length; ii++) { // iterate through list of locales
          if (sourceLocale !== completedLocales[ii]) { // skip the source locale
            translation = this.store(txResource.key + txResourceName +
              completedLocales[ii]);
            if (typeof translation.content === 'string') {
              zdLocale = syncUtil.txLocaletoZd(completedLocales[ii]);
              this.zdUpsertCategoryTranslation(translation.content, category.id,
                zdLocale);
            }
          }
        }
      }
    },
    uiCategoriesSync: function(event) {
      if (event) event.preventDefault();
      this.asyncGetTxProject();
      this.asyncGetZdCategoriesFull(syncCategories.currentpage, syncCategories.sortby,
        syncCategories.sortdirection, syncCategories.perpage);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiCategoriesInit;
    },
    uiCategoriesDownloadCompletedTranslations: function(event) {
      if (event) event.preventDefault();
      var linkId = "#" + event.target.id;
      var project = this.store(txProject.key);
      var sourceLocale = txProject.getSourceLocale(project);
      var txResourceName = this.$(linkId).attr("data-resource");
      var zdObjectId = this.$(linkId).attr("data-zd-object-id");
      var s = this.store(txResource.key + txResourceName);
      var completedLocales = this.completedLanguages(s);
      var zdLocale, translation;
      for (var i = 0; i < completedLocales.length; i++) { // iterate through list of locales
        if (sourceLocale !== completedLocales[i]) { // skip the source locale
          translation = this.store(txResource.key + txResourceName +
            completedLocales[i]);
          if (typeof translation.content === 'string') {
            zdLocale = syncUtil.txLocaletoZd(completedLocales[i]);
            this.zdUpsertCategoryTranslation(translation.content, zdObjectId,
              zdLocale);
          }
        }
      }
    },
    uiCategoriesUpsert: function(event) {
      if (event) event.preventDefault();
      var linkId = "#" + event.target.id;
      var txResourceName = this.$(linkId).attr("data-resource");
      var zdObjectId = this.$(linkId).attr("data-zd-object-id");
      var zdObjectType = this.$(linkId).attr("data-zd-object-type");
      var categories = this.store(zdCategory.key);
      var category = this.getSingleCategory(zdObjectId, categories);
      var resource_request = {};
      if (io.hasFeature('html-tx-resource')) {
        resource_request = common.txRequestHTML(category);
      } else {
        resource_request = common.getTxRequest(category);
      }
      this.loadSyncPage = this.uiCategoriesUpsertComplete;
      io.pushSync(txResource.key + txResourceName + 'upsert');
      this.txUpsertResource(resource_request, txResourceName);
    },
    uiCategoriesUpsertComplete: function() {
      logger.debug('reload TxProject');
      this.asyncGetTxProject();
    },
    uiCategoriesPerPage: function(event) {
      if (event) event.preventDefault();
      syncCategories.perpage = this.$(event.target).closest('[perpage]').attr('perpage');
      syncCategories.currentpage = '1';
      this.asyncGetZdCategoriesFull(syncCategories.currentpage, syncCategories.sortby,
        syncCategories.sortdirection, syncCategories.perpage);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiCategoriesInit;
    },
    uiCategoriesSortByUpdated: function(event) {
      if (event) event.preventDefault();
      syncCategories.sortby = 'updated_at';
      syncCategories.sortdirection = 'asc';
      syncCategories.currentpage = '1';
      this.asyncGetZdCategoriesFull(syncCategories.currentpage, syncCategories.sortby,
        syncCategories.sortdirection);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiCategoriesInit;
    },
    uiCategoriesSortByTitle: function(event) {
      if (event) event.preventDefault();
      syncCategories.sortby = 'title';
      syncCategories.sortdirection = 'asc';
      syncCategories.currentpage = '1';
      this.asyncGetZdCategoriesFull(syncCategories.currentpage, syncCategories.sortby,
        syncCategories.sortdirection);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiCategoriesInit;
    },
    uiCategoriesResourceStatsComplete: function() {
      logger.debug('uiCategoriesResourceStatsComplete');
      var categoryData = this.calcResourceNameCategory(this.store(zdCategory.key));
      var numCategories = categoryData.categories.length;
      var resourceName, resource;
      for (var i = 0; i < numCategories; i++) {
        resourceName = categoryData.categories[i].resource_name;
        resource = this.store(txResource.key + resourceName);
        var tx_completed = this.completedLanguages(resource);
        common.addCompletedLocales(this.$, resourceName, tx_completed);
        if (typeof resource !== 'number') {
          common.activateTxLink(this.$, resourceName);
          common.activateUploadButton(this.$, resourceName, false);
        } else {
          if ((typeof resource === 'number') && (resource === 404)) {
            common.activateUploadButton(this.$, resourceName, true);
          }
          if ((typeof resource === 'number') && (resource === 401)) {
            //TODO Error message on this resource
          }
        }
      }

      this.loadSyncPage = this.uiCategoriesLanguageComplete;
      this.syncCompletedLanguagesCategory();

    },
    uiCategoriesLanguageComplete: function() {
      logger.debug('uiCategoriesLanguageComplete');
      var categoryData = this.calcResourceNameCategory(this.store(zdCategory.key));
      var numCategories = categoryData.categories.length;

      // Local loop vars
      var numLanguages = 0;
      var resourceName = '';
      var resource = {};
      var languageArray = [];
      var resourceLanguage = {};

      for (var i = 0; i < numCategories; i++) {
        resourceName = categoryData.categories[i].resource_name;
        resource = this.store(txResource.key + resourceName);
        //TODO depends on resource typeness
        if (typeof resource !== 'number') {
          languageArray = this.completedLanguages(resource);
          numLanguages = languageArray.length;
          for (var ii = 0; ii < numLanguages; ii++) {
            resourceLanguage = this.store(txResource.key + resourceName +
              languageArray[ii]);
            if (resourceLanguage) {
              common.activateDownloadButton(this.$, resourceName);
            }
          }
        }
      }

    },
    uiCategoriesGotoPage: function(event) {
      if (event) event.preventDefault();
      logger.debug('uiCategoriesGotoPage');
      var linkId = "#" + event.target.id;
      var page = this.$(linkId).attr("data-page");
      syncCategories.currentpage = page;
      this.asyncGetZdCategoriesFull(syncCategories.currentpage, syncCategories.sortby,
        syncCategories.sortdirection, syncCategories.perpage);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiCategoriesInit;
    },
    uiCategoriesNextPage: function(event) {
      if (event) event.preventDefault();
      logger.debug('uiCategoriesNextPage');
      var linkId = "#" + event.target.id;
      var page = this.$(linkId).attr("data-current-page");
      var nextPage = parseInt(page, 10) + 1;
      syncCategories.currentpage = nextPage;
      this.asyncGetZdCategoriesFull(syncCategories.currentpage, syncCategories.sortby,
        syncCategories.sortdirection, syncCategories.perpage);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiCategoriesInit;
    },
    uiCategoriesPrevPage: function(event) {
      if (event) event.preventDefault();
      logger.debug('uiCategoriesPrevPage');
      var linkId = "#" + event.target.id;
      var page = this.$(linkId).attr("data-current-page");
      var prevPage = parseInt(page, 10) - 1;
      syncCategories.currentpage = prevPage;
      this.asyncGetZdCategoriesFull(syncCategories.currentpage, syncCategories.sortby,
        syncCategories.sortdirection, syncCategories.perpage);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiCategoriesInit;
    },

  },
  actionHandlers: {
    syncCategoryTranslations: function() {
      logger.debug('syncCategoryTranslations started');
      var categoryData = this.store(zdCategory.key);
      var OKToGetCategoryTranslations = (typeof categoryData === 'undefined') ?
        false : true;
      var obj, numCategories;
      if (OKToGetCategoryTranslations) {
        obj = this.calcResourceNameCategory(categoryData);
        numCategories = obj.categories.length;
        for (var i = 0; i < numCategories; i++) {
          this.asyncGetZdCategoryTranslations(obj.categories[i].id);
        }
      }
    },
    syncResourceStatsCategory: function() {
      logger.debug('syncResourceStatsCategory started');
      var categoryData = this.store(zdCategory.key);
      var OKToGetResourceStats = (typeof categoryData === 'undefined') ?
        false : true;
      var obj, numCategories;
      if (OKToGetResourceStats) {
        obj = this.calcResourceNameCategory(categoryData);
        numCategories = obj.categories.length;
        for (var i = 0; i < numCategories; i++) {
          this.asyncGetTxResourceStats(obj.categories[i].resource_name);
        }
      }
    },
    syncCompletedLanguagesCategory: function() {
      // Requires txProject, zdCategories, and ResourceStats
      logger.debug('syncCompletedLanguagesCategory started');
      // Local function vars
      var categoryData = this.calcResourceNameCategory(this.store(zdCategory.key));
      var numCategories = categoryData.categories.length;

      // Local loop vars
      var numLanguages = 0;
      var resourceName = '';
      var resource = {};
      var languageArray = [];

      for (var i = 0; i < numCategories; i++) {
        resourceName = categoryData.categories[i].resource_name;
        resource = this.store(txResource.key + resourceName);
        //TODO depends on resource typeness, fast n loose
        if (typeof resource == 'object') {
          languageArray = this.completedLanguages(resource);
          numLanguages = languageArray.length;
          for (var ii = 0; ii < numLanguages; ii++) {
            // Side effect: make api calls and load resources
            this.asyncGetTxResource(resourceName, languageArray[ii]);
          }
        }
      }
    },
    buildSyncPageCategoriesData: function() {
      var categoryData = this.store(zdCategory.key);
      var categories = this.calcResourceNameCategory(categoryData);
      var type = 'categories';
      var limit = categories.categories.length;
      var ret = [];
      var d, e, s;
      var tx_completed, zd_object_url, tx_resource_url, zd_object_updated;
      for (var i = 0; i < limit; i++) {
        e = categories.categories[i];
        s = this.store(txResource.key + e.resource_name);
        tx_completed = this.completedLanguages(s);
        zd_object_url = "https://txtest.zendesk.com/hc/" + e.source_locale +
          "/" + type + "/" + e.id;
        tx_resource_url = "https://www.transifex.com/projects/p/" +
          txProject.name + "/" + e.resource_name;
        zd_object_updated = moment(e.updated_at).format(
          'MMM D YYYY h:mma');
        d = {};
        d = _.extend(d, {
          name: e.resource_name
        }, {
          zd_object_type: type
        }, {
          zd_object_id: e.id
        }, {
          zd_object_url: zd_object_url
        }, {
          zd_object_updated: zd_object_updated
        }, {
          zd_outdated: false
        }, {
          tx_resource_url: tx_resource_url
        }, {
          tx_completed: tx_completed
        }, {
          title_string: e.title
        });
        ret.push(d);
      }
      var paginationVisible = this.checkPaginationCategory(categoryData);
      if (paginationVisible) {
        var currentPage = this.getCurrentPageCategory(categoryData);
        syncCategories.currentpage = currentPage;
        ret = _.extend(ret, {
          page_prev_enabled: this.isFewerCategory(categoryData, currentPage),
          page_next_enabled: this.isMoreCategory(categoryData, currentPage),
          current_page: this.getCurrentPageCategory(categoryData),
          pagination_visible: paginationVisible,
          pages: this.getPagesCategory(categoryData)
        });
      }
      return ret;
    },
  },
};

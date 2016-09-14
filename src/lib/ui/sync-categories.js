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
  currentpage: '1',
  events: {
    'click [tab="categories"]': 'uiCategoriesTab',
    'click js-categories .js-goto-page': 'uiCategoriesGotoPage',
    'click js-categories .js-goto-next': 'uiCategoriesNextPage',
    'click js-categories .js-goto-prev': 'uiCategoriesPrevPage',
    'click js-categories .js-sortby-title': 'uiCategoriesSortByTitle',
    'click js-categories .js-sortby-updated': 'uiCategoriesSortByUpdated',
    'click js-categories [perpage]': 'uiCategoriesPerPage',
    'click js-categories .js-batch-upload': 'uiCategoriesBatchUpload',
    'click js-categories .js-batch-download': 'uiCategoriesBatchDownload',
    'click js-categories .js-refresh': 'uiCategoriesSync'
  },
  eventHandlers: {
    uiCategoriesTab: function(event) {
      if (event) event.preventDefault();
      syncCategories.currentpage = '1';
      this.uiCategoriesSync();
    },
    uiCategoriesInit: function(event) {
      if (event) event.preventDefault();
      logger.debug('uiCategoriesInit');

      var pageData = this.buildSyncPageCategoriesData();
      this.switchTo('sync_page', {
        page: 'categories',
        page_categories: true,
        dataset: pageData,
      });

      var sorting = io.getSorting();
      if (sorting.sortby === 'updated_at') {
        this.$('#sortby-last-updated').addClass("disabled");
        this.$('#sortby-title').removeClass("disabled");
      }
      else if (sorting.sortby === 'title') {
        this.$('#sortby-last-updated').removeClass("disabled");
        this.$('#sortby-title').addClass("disabled");
      }
      this.$('[perpage]').removeClass('is-active');
      this.$('[perpage="' + sorting.perpage + '"]').addClass('is-active');

      this.loadSyncPage = this.uiCategoriesResourceStatsComplete;
      this.syncResourceStatsCategories();
      this.syncCategoriesTranslations();
    },
    uiCategoriesBatchUpload: function(event) {
      if (event) event.preventDefault();
      var categoryData = this.store(zdCategory.key),
          obj = this.calcResourceNameCategories(categoryData),
          numCategories = obj.categories.length,
          category, resource_request, txResourceName;
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
      var project = this.store(txProject.key),
          sourceLocale = txProject.getSourceLocale(project),
          categoryData = this.store(zdCategory.key),
          obj = this.calcResourceNameCategories(categoryData),
          numCategories = obj.categories.length,
          category, resource, txResourceName, completedLocales,
          zdLocale, translation;
      for (var i = 0; i < numCategories; i++) {
        category = obj.categories[i];
        txResourceName = category.resource_name;
        resource = this.store(txResource.key + txResourceName);
        completedLocales = this.completedLanguages(resource);

        for (var ii = 0; ii < completedLocales.length; ii++) { // iterate through list of locales
          if (sourceLocale !== completedLocales[ii]) { // skip the source locale
            translation = this.store(txResource.key + txResourceName + completedLocales[ii]);
            if (typeof translation.content === 'string') {
              zdLocale = syncUtil.txLocaletoZd(completedLocales[ii]);
              this.zdUpsertCategoriesTranslation(translation.content, category.id, zdLocale);
            }
          }
        }
      }
    },
    uiCategoriesSync: function(event) {
      if (event) event.preventDefault();
      var sorting = io.getSorting();
      this.asyncGetTxProject();
      this.asyncGetZdCategoriesFull(
        syncCategories.currentpage, sorting.sortby,
        sorting.sortdirection, sorting.perpage
      );
      this.switchTo('loading_page', { page_categories: true });
      this.loadSyncPage = this.uiCategoriesInit;
    },
    uiCategoriesDownloadCompletedTranslations: function(event) {
      if (event) event.preventDefault();
      var linkId = "#" + event.target.id,
          project = this.store(txProject.key),
          sourceLocale = txProject.getSourceLocale(project),
          txResourceName = this.$(linkId).attr("data-resource"),
          zdObjectId = this.$(linkId).attr("data-zd-object-id"),
          s = this.store(txResource.key + txResourceName),
          completedLocales = this.completedLanguages(s),
          zdLocale, translation;
      for (var i = 0; i < completedLocales.length; i++) { // iterate through list of locales
        if (sourceLocale !== completedLocales[i]) { // skip the source locale
          translation = this.store(txResource.key + txResourceName + completedLocales[i]);
          if (typeof translation.content === 'string') {
            zdLocale = syncUtil.txLocaletoZd(completedLocales[i]);
            this.zdUpsertCategoriesTranslation(translation.content, zdObjectId, zdLocale);
          }
        }
      }
    },
    uiCategoriesUpsert: function(event) {
      if (event) event.preventDefault();
      var linkId = "#" + event.target.id,
          txResourceName = this.$(linkId).attr("data-resource"),
          zdObjectId = this.$(linkId).attr("data-zd-object-id"),
          zdObjectType = this.$(linkId).attr("data-zd-object-type"),
          categories = this.store(zdCategory.key),
          category = this.getSingleCategory(zdObjectId, categories),
          resource_request = {};
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
      var sorting = io.getSorting();
      sorting.perpage = this.$(event.target).closest('[perpage]').attr('perpage');
      io.setSorting(sorting);
      syncCategories.currentpage = '1';
      this.asyncGetZdCategoriesFull(
        syncCategories.currentpage, sorting.sortby,
        sorting.sortdirection, sorting.perpage
      );
      this.switchTo('loading_page', { page_categories: true });
      this.loadSyncPage = this.uiCategoriesInit;
    },
    uiCategoriesSortByUpdated: function(event) {
      if (event) event.preventDefault();
      var sorting = io.getSorting();
      sorting.sortby = 'updated_at';
      sorting.sortdirection = 'asc';
      io.setSorting(sorting);
      syncCategories.currentpage = '1';
      this.asyncGetZdCategoriesFull(
        syncCategories.currentpage, sorting.sortby,
        sorting.sortdirection
      );
      this.switchTo('loading_page', { page_categories: true });
      this.loadSyncPage = this.uiCategoriesInit;
    },
    uiCategoriesSortByTitle: function(event) {
      if (event) event.preventDefault();
      var sorting = io.getSorting();
      sorting.sortby = 'title';
      sorting.sortdirection = 'asc';
      syncCategories.currentpage = '1';
      this.asyncGetZdCategoriesFull(
        syncCategories.currentpage, sorting.sortby,
        sorting.sortdirection
      );
      this.switchTo('loading_page', { page_categories: true });
      this.loadSyncPage = this.uiCategoriesInit;
    },
    uiCategoriesResourceStatsComplete: function() {
      logger.debug('uiCategoriesResourceStatsComplete');
      var categoryData = this.calcResourceNameCategories(this.store(zdCategory.key)),
          numCategories = categoryData.categories.length,
          resourceName, resource;
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
      this.syncCompletedLanguagesCategories();
    },
    uiCategoriesLanguageComplete: function() {
      logger.debug('uiCategoriesLanguageComplete');
      var categoryData = this.calcResourceNameCategories(this.store(zdCategory.key)),
          numCategories = categoryData.categories.length,
          numLanguages = 0,
          resourceName = '',
          resource = {},
          languageArray = [],
          resourceLanguage = {};
      for (var i = 0; i < numCategories; i++) {
        resourceName = categoryData.categories[i].resource_name;
        resource = this.store(txResource.key + resourceName);
        //TODO depends on resource typeness
        if (typeof resource !== 'number') {
          languageArray = this.completedLanguages(resource);
          numLanguages = languageArray.length;
          for (var ii = 0; ii < numLanguages; ii++) {
            resourceLanguage = this.store(txResource.key + resourceName + languageArray[ii]);
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
      var linkId = "#" + event.target.id,
          page = this.$(linkId).attr("data-page"),
          sorting = io.getSorting();
      syncCategories.currentpage = page;
      this.asyncGetZdCategoriesFull(
        syncCategories.currentpage, sorting.sortby,
        sorting.sortdirection, sorting.perpage
      );
      this.switchTo('loading_page', { page_categories: true });
      this.loadSyncPage = this.uiCategoriesInit;
    },
    uiCategoriesNextPage: function(event) {
      if (event) event.preventDefault();
      logger.debug('uiCategoriesNextPage');
      var linkId = "#" + event.target.id,
          page = this.$(linkId).attr("data-current-page"),
          nextPage = parseInt(page, 10) + 1,
          sorting = io.getSorting();
      syncCategories.currentpage = nextPage;
      this.asyncGetZdCategoriesFull(
        syncCategories.currentpage, sorting.sortby,
        sorting.sortdirection, sorting.perpage
      );
      this.switchTo('loading_page', { page_categories: true });
      this.loadSyncPage = this.uiCategoriesInit;
    },
    uiCategoriesPrevPage: function(event) {
      if (event) event.preventDefault();
      logger.debug('uiCategoriesPrevPage');
      var linkId = "#" + event.target.id,
          page = this.$(linkId).attr("data-current-page"),
          prevPage = parseInt(page, 10) - 1,
          sorting = io.getSorting();
      syncCategories.currentpage = prevPage;
      this.asyncGetZdCategoriesFull(
        syncCategories.currentpage, sorting.sortby,
        sorting.sortdirection, sorting.perpage
      );
      this.switchTo('loading_page', { page_categories: true });
      this.loadSyncPage = this.uiCategoriesInit;
    },
  },
  actionHandlers: {
    syncCategoriesTranslations: function() {
      logger.debug('syncCategoriesTranslations started');
      var categoryData = this.store(zdCategory.key),
          OKToGetCategoryTranslations = (typeof categoryData === 'undefined') ? false : true,
          obj, numCategories;
      if (OKToGetCategoryTranslations) {
        obj = this.calcResourceNameCategories(categoryData);
        numCategories = obj.categories.length;
        for (var i = 0; i < numCategories; i++) {
          this.asyncGetZdCategoriesTranslations(obj.categories[i].id);
        }
      }
    },
    syncResourceStatsCategories: function() {
      logger.debug('syncResourceStatsCategories started');
      var categoryData = this.store(zdCategory.key),
          OKToGetResourceStats = (typeof categoryData === 'undefined') ? false : true,
          obj, numCategories;
      if (OKToGetResourceStats) {
        obj = this.calcResourceNameCategories(categoryData);
        numCategories = obj.categories.length;
        for (var i = 0; i < numCategories; i++) {
          this.asyncGetTxResourceStats(obj.categories[i].resource_name);
        }
      }
    },
    syncCompletedLanguagesCategories: function() {
      // Requires txProject, zdCategories, and ResourceStats
      logger.debug('syncCompletedLanguagesCategories started');
      // Local function vars
      var categoryData = this.calcResourceNameCategories(this.store(zdCategory.key)),
          numCategories = categoryData.categories.length,
          numLanguages = 0,
          resourceName = '',
          resource = {},
          languageArray = [];
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
      var categoryData = this.store(zdCategory.key),
          categories = this.calcResourceNameCategories(categoryData),
          type = 'categories',
          limit = categories.categories.length,
          ret = [],
          d, e, s,
          tx_completed, zd_object_url, tx_resource_url, zd_object_updated;
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
      var paginationVisible = this.checkPaginationCategories(categoryData);
      if (paginationVisible) {
        var currentPage = this.getCurrentPageCategories(categoryData);
        syncCategories.currentpage = currentPage;
        ret = _.extend(ret, {
          page_prev_enabled: this.isFewerCategories(categoryData, currentPage),
          page_next_enabled: this.isMoreCategories(categoryData, currentPage),
          current_page: this.getCurrentPageCategories(categoryData),
          pagination_visible: paginationVisible,
          pages: this.getPagesCategories(categoryData)
        });
      }
      return ret;
    },
  },
};

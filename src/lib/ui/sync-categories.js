/**
 * Code behind for the sync-page-categories
 * @module ui/sync-categories
 */

var zdCategory = require('../zendesk-api/category');
var txProject = require('../transifex-api/project');
var txResource = require('../transifex-api/resource');
var syncUtil = require('../syncUtil');
var common = require('../common');

var syncCategories = module.exports = {
  // selfies
  name: 'sync_page_categories_ui',
  key: 'sync_page_categories',
  sortby: '',
  sortdirection: '',
  perpage: '7',
  currentpage: '1',
  logging: true,
  events: {
    'click .page_action_categories': 'uiSyncPageCategoriesInit',
    'click .page_action_page': 'uiSyncPageGotoPage',
    'click .page_action_next': 'uiSyncPageNextPage',
    'click .page_action_prev': 'uiSyncPagePrevPage',
    'click .page_action_sync': 'uiSyncCategories'
  },
  eventHandlers: {
    uiSyncPageCategoriesInit: function() {
      if (syncCategories.logging) {
        console.log('uiSyncPageCategoriesInit');
      }
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
      if (syncCategories.perpage === '20') {
        this.$('#perpage-ten').removeClass("disabled");
        this.$('#perpage-twenty').addClass("disabled");
      }
      if (syncCategories.perpage === '10') {
        this.$('#perpage-twenty').removeClass("disabled");
        this.$('#perpage-ten').addClass("disabled");
      }

      this.loadSyncPage = this.uiSyncPageResourceStatsComplete;
      this.syncResourceStats();
      this.syncCategoryTranslations();
    },
    uiSyncCategories: function(event) {
      event.preventDefault();
      this.asyncGetTxProject();
      this.asyncGetZdCategoriesFull(syncCategories.currentpage,
        syncCategories.sortby, syncCategories.sortdirection,
        syncCategories.perpage);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiSyncPageCategoriesInit;
    },
    uiSyncDownloadCompletedTranslations: function(event) {
      event.preventDefault();
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
            this.zdUpsertCategoryTranslation(translation.content,
              zdObjectId, zdLocale);
          }
        }
      }
    },
    uiSyncUpsertCategory: function(event) {
      event.preventDefault();
      var linkId = "#" + event.target.id;
      var txResourceName = this.$(linkId).attr("data-resource");
      var zdObjectId = this.$(linkId).attr("data-zd-object-id");
      var zdObjectType = this.$(linkId).attr("data-zd-object-type");
      var categories = this.store(zdCategory.key);
      var category = this.getSingle(zdObjectId, categories);
      var resource_request = {};
      if (this.featureConfig('html-tx-resource')) {
        resource_request = common.txRequestHTML(category);
      } else {
        resource_request = common.getTxRequest(category);
      }
      this.loadSyncPage = this.uiSyncUpsertCategoryComplete;
      this.syncStatus.push(txResource.key + txResourceName + 'upsert');
      this.txUpsertResource(resource_request, txResourceName);
    },
    uiSyncUpsertCategoryComplete: function() {
      this.loadSyncPage = function() {
        console.log('reload TxProject');
      };
      this.asyncGetTxProject();
    },
    uiSyncPageResourceStatsComplete: function() {
      if (syncCategories.logging) {
        console.log('uiSyncPageResourceStatsComplete');
      }
      var categoryData = this.calcResourceName(this.store(zdCategory.key));
      var numCategories = categoryData.categories.length;
      var resourceName, resource;
      for (var i = 0; i < numCategories; i++) {
        resourceName = categoryData.categories[i].resource_name;
        resource = this.store(txResource.key + resourceName);
        var tx_completed = this.completedLanguages(resource);
        this.addCompletedLocales(resourceName, tx_completed);
        if (typeof resource !== 'number') {
          this.activateTxLink(resourceName);
          this.activateUploadButton(resourceName, false);
        } else {
          if ((typeof resource === 'number') && (resource === 404)) {
            this.activateUploadButton(resourceName, true);
          }
          if ((typeof resource === 'number') && (resource === 401)) {
            //TODO Error message on this resource
          }
        }
      }

      this.loadSyncPage = this.uiSyncPageLanguageComplete;
      this.syncCompletedLanguages();

    },
    uiSyncPageLanguageComplete: function() {
      if (syncCategories.logging) {
        console.log('uiSyncPageLanguageComplete');
      }
      var categoryData = this.calcResourceName(this.store(zdCategory.key));
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
              this.activateDownloadButton(resourceName);
            }
          }
        }
      }

    },
    uiSyncPageGotoPage: function(event) {
      if (syncCategories.logging) {
        console.log('uiSyncPageGotoPage');
      }
      var linkId = "#" + event.target.id;
      var page = this.$(linkId).attr("data-page");
      syncCategories.currentpage = page;
      this.asyncGetZdCategoriesFull(syncCategories.currentpage,
        syncCategories.sortby, syncCategories.sortdirection,
        syncCategories.perpage);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiSyncPageCategoriesInit;
    },
    uiSyncPageNextPage: function(event) {
      if (syncCategories.logging) {
        console.log('uiSyncPageNextPage');
      }
      var linkId = "#" + event.target.id;
      var page = this.$(linkId).attr("data-current-page");
      var nextPage = parseInt(page, 10) + 1;
      syncCategories.currentpage = nextPage;
      this.asyncGetZdCategoriesFull(syncCategories.currentpage,
        syncCategories.sortby, syncCategories.sortdirection,
        syncCategories.perpage);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiSyncPageCategoriesInit;
    },
    uiSyncPagePrevPage: function(event) {
      if (this.isDebug()) {
        console.log('uiSyncPagePrevPage');
      }
      var linkId = "#" + event.target.id;
      var page = this.$(linkId).attr("data-current-page");
      var prevPage = parseInt(page, 10) - 1;
      syncCategories.currentpage = prevPage;
      this.asyncGetZdCategoriesFull(syncCategories.currentpage,
        syncCategories.sortby, syncCategories.sortdirection,
        syncCategories.perpage);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiSyncPageCategoriesInit;
    },

  },
  actionHandlers: {
    activateTxLink: function(name) {
      var linkId = "#" + "txlink-" + name;
      this.$(linkId).removeClass("disabled");
    },
    addCompletedLocales: function(name, locales) {
      var linkId = "#" + "locales-" + name;
      if (!(_.isEmpty(locales))) {
        this.$(linkId).text(locales.toString());
      } else {
        this.$(linkId).text('None Found');
      }
    },
    activateUploadButton: function(name, isNew) {
      var linkId = "#" + "upload-" + name;
      if (isNew) {
        this.$(linkId).text('Upload');
      } else {
        this.$(linkId).text('Upload');
      }
      this.$(linkId).removeClass("disabled");
      this.$(linkId).click(this.uiSyncUpsertCategory.bind(this));
      this.$(linkId).css('cursor', 'pointer');
    },
    activateDownloadButton: function(name) {
      var linkId = "#" + "download-" + name;
      this.$(linkId).text('Download');
      this.$(linkId).removeClass("disabled");
      this.$(linkId).click(function() {
        alert('Happy day');
      });
      this.$(linkId).css('cursor', 'pointer');
    },
    syncCategoryTranslations: function() {
      console.log('syncCategoryTranslations started');
      var categoryData = this.store(zdCategory.key);
      var OKToGetCategoryTranslations = (typeof categoryData ===
        'undefined') ? false : true;
      var obj, numCategories;
      if (OKToGetCategoryTranslations) {
        obj = this.calcResourceName(categoryData);
        numCategories = obj.categories.length;
        for (var i = 0; i < numCategories; i++) {
          this.asyncGetZdCategoryTranslations(obj.categories[i].id);
        }
      }
    },
    syncResourceStats: function() {
      console.log('syncResourceStats started');
      var categoryData = this.store(zdCategory.key);
      var OKToGetResourceStats = (typeof categoryData === 'undefined') ?
        false : true;
      var obj, numCategories;
      if (OKToGetResourceStats) {
        obj = this.calcResourceName(categoryData);
        numCategories = obj.categories.length;
        for (var i = 0; i < numCategories; i++) {
          this.asyncGetTxResourceStats(obj.categories[i].resource_name);
        }
      }
    },
    syncCompletedLanguages: function() {
      // Requires txProject, zdCategories, and ResourceStats
      console.log('syncCompletedLanguages started');
      // Local function vars
      var categoryData = this.calcResourceName(this.store(zdCategory.key));
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
      var categories = this.calcResourceName(categoryData);
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
          'MMMM Do YYYY </br> h:mm:ss a');
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
      var paginationVisible = this.checkPagination(categoryData);
      if (paginationVisible) {
        var currentPage = this.getCurrentPage(categoryData);
        syncCategories.currentpage = currentPage;
        ret = _.extend(ret, {
          page_prev_enabled: this.isFewer(categoryData, currentPage),
          page_next_enabled: this.isMore(categoryData, currentPage),
          current_page: this.getCurrentPage(categoryData),
          pagination_visible: paginationVisible,
          pages: this.getPages(categoryData)
        });
      }
      return ret;
    },
  },
};

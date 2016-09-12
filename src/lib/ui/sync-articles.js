/**
 * The Transifex project API gets project data
 * @module transifex-api/project
 */

var zdArticle = require('../zendesk-api/article'),
    txProject = require('../transifex-api/project'),
    txResource = require('../transifex-api/resource'),
    syncUtil = require('../syncUtil'),
    logger = require('../logger'),
    common = require('../common');

var syncArticles = module.exports = {
  // selfies
  name: 'sync_page_articles_ui',
  key: 'sync_page_articles',
  sortby: '',
  sortdirection: '',
  perpage: '7',
  currentpage: '1',
  events: {
    'click .page_action_articles': 'uiSyncPageArticlesInit',
    'click .page_action_page': 'uiSyncPageGotoPage',
    'click .page_action_next': 'uiSyncPageNextPage',
    'click .page_action_prev': 'uiSyncPagePrevPage',
    'click .page_action_sort_by_title': 'uiSyncPageSortByTitle',
    'click .page_action_sort_by_updated': 'uiSyncPageSortByUpdated',
    'click .page_action_per_page_ten': 'uiSyncPagePerPageTen',
    'click .page_action_per_page_twenty': 'uiSyncPagePerPageTwenty',
    'click .page_action_batch_upload': 'uiBatchUpload',
    'click .page_action_batch_download': 'uiBatchDownload',
    'click .page_action_sync': 'uiSyncArticles'
  },
  eventHandlers: {
    uiSyncPageArticlesInit: function() {
      logger.debug('uiSyncPageArticlesInit');
      var pageData = this.buildSyncPageArticlesData();
      this.switchTo('sync_page_articles', {
        dataset: pageData,
      });
      if (syncArticles.sortby === 'updated_at') {
        this.$('#sortby-last-updated').addClass("disabled");
        this.$('#sortby-title').removeClass("disabled");
      }
      if (syncArticles.sortby === 'title') {
        this.$('#sortby-last-updated').removeClass("disabled");
        this.$('#sortby-title').addClass("disabled");
      }
      if (syncArticles.perpage === '20') {
        this.$('#perpage-ten').removeClass("is-active");
        this.$('#perpage-twenty').addClass("is-active");
      }
      if (syncArticles.perpage === '10') {
        this.$('#perpage-twenty').removeClass("is-active");
        this.$('#perpage-ten').addClass("is-active");
      }

      this.loadSyncPage = this.uiSyncPageResourceStatsComplete;
      this.syncResourceStats();
      this.syncArticleTranslations();
    },
    uiBatchUpload: function(event) {
      event.preventDefault();
      var articleData = this.store(zdArticle.key);
      var obj = this.calcResourceName(articleData);
      var numArticles = obj.articles.length;
      var article, resource_request, txResourceName;
      for (var i = 0; i < numArticles; i++) {
        article = obj.articles[i];
        txResourceName = article.resource_name;
        resource_request = {};
        if (this.featureConfig('html-tx-resource')) {
          resource_request = common.txRequestHTML(article);
        } else {
          resource_request = common.getTxRequest(article);
        }
        this.loadSyncPage = this.uiSyncUpsertArticleComplete;
        this.syncStatus.push(txResource.key + txResourceName + 'upsert');
        this.txUpsertResource(resource_request, txResourceName);
      }
    },
    uiBatchDownload: function(event) {
      event.preventDefault();
      var project = this.store(txProject.key);
      var sourceLocale = txProject.getSourceLocale(project);
      var articleData = this.store(zdArticle.key);
      var obj = this.calcResourceName(articleData);
      var numArticles = obj.articles.length;
      var article, resource, txResourceName, completedLocales;
      var zdLocale, translation;
      for (var i = 0; i < numArticles; i++) {
        article = obj.articles[i];
        txResourceName = article.resource_name;
        resource = this.store(txResource.key + txResourceName);
        completedLocales = this.completedLanguages(resource);

        for (var ii = 0; ii < completedLocales.length; ii++) { // iterate through list of locales
          if (sourceLocale !== completedLocales[ii]) { // skip the source locale
            translation = this.store(txResource.key + txResourceName +
              completedLocales[ii]);
            if (typeof translation.content === 'string') {
              zdLocale = syncUtil.txLocaletoZd(completedLocales[ii]);
              this.zdUpsertArticleTranslation(translation.content, article.id,
                zdLocale);
            }
          }
        }
      }
    },
    uiSyncArticles: function(event) {
      event.preventDefault();
      this.asyncGetTxProject();
      this.asyncGetZdArticlesFull(syncArticles.currentpage, syncArticles.sortby,
        syncArticles.sortdirection, syncArticles.perpage);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiSyncPageArticlesInit;
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
            this.zdUpsertArticleTranslation(translation.content, zdObjectId,
              zdLocale);
          }
        }
      }
    },
    uiSyncUpsertArticle: function(event) {
      event.preventDefault();
      var linkId = "#" + event.target.id;
      var txResourceName = this.$(linkId).attr("data-resource");
      var zdObjectId = this.$(linkId).attr("data-zd-object-id");
      var zdObjectType = this.$(linkId).attr("data-zd-object-type");
      var articles = this.store(zdArticle.key);
      var article = this.getSingle(zdObjectId, articles);
      var resource_request = {};
      if (this.featureConfig('html-tx-resource')) {
        resource_request = common.txRequestHTML(article);
      } else {
        resource_request = common.getTxRequest(article);
      }
      this.loadSyncPage = this.uiSyncUpsertArticleComplete;
      this.syncStatus.push(txResource.key + txResourceName + 'upsert');
      this.txUpsertResource(resource_request, txResourceName);
    },
    uiSyncUpsertArticleComplete: function() {
      logger.debug('reload TxProject');
      this.asyncGetTxProject();
    },
    uiSyncPagePerPageTen: function() {
      syncArticles.perpage = '10';
      syncArticles.currentpage = '1';
      this.asyncGetZdArticlesFull(syncArticles.currentpage, syncArticles.sortby,
        syncArticles.sortdirection, syncArticles.perpage);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiSyncPageArticlesInit;
    },
    uiSyncPagePerPageTwenty: function() {
      syncArticles.perpage = '20';
      syncArticles.currentpage = '1';
      this.asyncGetZdArticlesFull(syncArticles.currentpage, syncArticles.sortby,
        syncArticles.sortdirection, syncArticles.perpage);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiSyncPageArticlesInit;
    },
    uiSyncPageSortByUpdated: function() {
      syncArticles.sortby = 'updated_at';
      syncArticles.sortdirection = 'asc';
      syncArticles.currentpage = '1';
      this.asyncGetZdArticlesFull(syncArticles.currentpage, syncArticles.sortby,
        syncArticles.sortdirection);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiSyncPageArticlesInit;
    },
    uiSyncPageSortByTitle: function() {
      syncArticles.sortby = 'title';
      syncArticles.sortdirection = 'asc';
      syncArticles.currentpage = '1';
      this.asyncGetZdArticlesFull(syncArticles.currentpage, syncArticles.sortby,
        syncArticles.sortdirection);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiSyncPageArticlesInit;
    },
    uiSyncPageResourceStatsComplete: function() {
      logger.debug('uiSyncPageResourceStatsComplete');
      var articleData = this.calcResourceName(this.store(zdArticle.key));
      var numArticles = articleData.articles.length;
      var resourceName, resource;
      for (var i = 0; i < numArticles; i++) {
        resourceName = articleData.articles[i].resource_name;
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
      logger.debug('uiSyncPageLanguageComplete');
      var articleData = this.calcResourceName(this.store(zdArticle.key));
      var numArticles = articleData.articles.length;

      // Local loop vars
      var numLanguages = 0;
      var resourceName = '';
      var resource = {};
      var languageArray = [];
      var resourceLanguage = {};

      for (var i = 0; i < numArticles; i++) {
        resourceName = articleData.articles[i].resource_name;
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
      logger.debug('uiSyncPageGotoPage');
      var linkId = "#" + event.target.id;
      var page = this.$(linkId).attr("data-page");
      syncArticles.currentpage = page;
      this.asyncGetZdArticlesFull(syncArticles.currentpage, syncArticles.sortby,
        syncArticles.sortdirection, syncArticles.perpage);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiSyncPageArticlesInit;
    },
    uiSyncPageNextPage: function(event) {
      logger.debug('uiSyncPageNextPage');
      var linkId = "#" + event.target.id;
      var page = this.$(linkId).attr("data-current-page");
      var nextPage = parseInt(page, 10) + 1;
      syncArticles.currentpage = nextPage;
      this.asyncGetZdArticlesFull(syncArticles.currentpage, syncArticles.sortby,
        syncArticles.sortdirection, syncArticles.perpage);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiSyncPageArticlesInit;
    },
    uiSyncPagePrevPage: function(event) {
      logger.debug('uiSyncPagePrevPage');
      var linkId = "#" + event.target.id;
      var page = this.$(linkId).attr("data-current-page");
      var prevPage = parseInt(page, 10) - 1;
      syncArticles.currentpage = prevPage;
      this.asyncGetZdArticlesFull(syncArticles.currentpage, syncArticles.sortby,
        syncArticles.sortdirection, syncArticles.perpage);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiSyncPageArticlesInit;
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
        this.$(linkId).text('-');
      }
    },
    activateUploadButton: function(name, isNew) {
      var linkId = "#" + "upload-" + name;

      this.$(linkId).removeClass("is-disabled");
      this.$(linkId).click(this.uiSyncUpsertArticle.bind(this));
      this.$(linkId).css('cursor', 'pointer');
    },
    activateDownloadButton: function(name) {
      var linkId = "#" + "download-" + name;

      this.$(linkId).removeClass("is-disabled");
      this.$(linkId).click(function() {
        alert('Happy day');
      });
      this.$(linkId).css('cursor', 'pointer');
    },
    syncArticleTranslations: function() {
      logger.debug('syncArticleTranslations started');
      var articleData = this.store(zdArticle.key);
      var OKToGetArticleTranslations = (typeof articleData === 'undefined') ?
        false : true;
      var obj, numArticles;
      if (OKToGetArticleTranslations) {
        obj = this.calcResourceName(articleData);
        numArticles = obj.articles.length;
        for (var i = 0; i < numArticles; i++) {
          this.asyncGetZdArticleTranslations(obj.articles[i].id);
        }
      }
    },
    syncResourceStats: function() {
      logger.debug('syncResourceStats started');
      var articleData = this.store(zdArticle.key);
      var OKToGetResourceStats = (typeof articleData === 'undefined') ?
        false : true;
      var obj, numArticles;
      if (OKToGetResourceStats) {
        obj = this.calcResourceName(articleData);
        numArticles = obj.articles.length;
        for (var i = 0; i < numArticles; i++) {
          this.asyncGetTxResourceStats(obj.articles[i].resource_name);
        }
      }
    },
    syncCompletedLanguages: function() {
      // Requires txProject, zdArticles, and ResourceStats
      logger.debug('syncCompletedLanguages started');
      // Local function vars
      var articleData = this.calcResourceName(this.store(zdArticle.key));
      var numArticles = articleData.articles.length;

      // Local loop vars
      var numLanguages = 0;
      var resourceName = '';
      var resource = {};
      var languageArray = [];

      for (var i = 0; i < numArticles; i++) {
        resourceName = articleData.articles[i].resource_name;
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
    buildSyncPageArticlesData: function() {
      var articleData = this.store(zdArticle.key);
      var articles = this.calcResourceName(articleData);
      var type = 'articles';
      var limit = articles.articles.length;
      var ret = [];
      var d, e, s;
      var tx_completed, zd_object_url, tx_resource_url, zd_object_updated;
      for (var i = 0; i < limit; i++) {
        e = articles.articles[i];
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
      var paginationVisible = this.checkPagination(articleData);
      if (paginationVisible) {
        var currentPage = this.getCurrentPage(articleData);
        syncArticles.currentpage = currentPage;
        ret = _.extend(ret, {
          page_prev_enabled: this.isFewer(articleData, currentPage),
          page_next_enabled: this.isMore(articleData, currentPage),
          current_page: this.getCurrentPage(articleData),
          pagination_visible: paginationVisible,
          pages: this.getPages(articleData)
        });
      }
      return ret;
    },
  },
};

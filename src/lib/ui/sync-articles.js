/**
 * Code behind for the sync-page-articles
 * @module ui/sync-articles
 */


var zdArticle = require('../zendesk-api/article'),
    txProject = require('../transifex-api/project'),
    txResource = require('../transifex-api/resource'),
    syncUtil = require('../syncUtil'),
    logger = require('../logger'),
    io = require('../io'),
    common = require('../common');

var syncArticles = module.exports = {
  // selfies
  name: 'sync_page_articles_ui',
  key: 'sync_page_articles',
  sortby: '',
  sortdirection: '',
  perpage: '10',
  currentpage: '1',
  events: {
    'click [tab="articles"]': 'uiArticlesTab',
    'click .page_action_page': 'uiArticlesGotoPage',
    'click .page_action_next': 'uiArticlesNextPage',
    'click .page_action_prev': 'uiArticlesPrevPage',
    'click .page_action_sort_by_title': 'uiArticlesSortByTitle',
    'click .page_action_sort_by_updated': 'uiArticlesSortByUpdated',
    'click [perpage]': 'uiArticlesPerPage',
    'click .page_action_batch_upload': 'uiArticlesBatchUpload',
    'click .page_action_batch_download': 'uiArticlesBatchDownload',
    'click .page_action_sync': 'uiArticlesSync'
  },
  eventHandlers: {
    uiArticlesTab: function(event) {
      if (event) event.preventDefault();
      this.currentpage = '1';
      this.uiArticlesSync();
    },
    uiArticlesInit: function(event) {
      if (event) event.preventDefault();
      logger.debug('uiArticlesInit');
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
      this.$('[perpage]').removeClass('is-active');
      this.$('[perpage="' + syncArticles.perpage + '"]').addClass('is-active');

      this.loadSyncPage = this.uiArticlesResourceStatsComplete;
      this.syncResourceStatsArticles();
      this.syncArticlesTranslations();
    },
    uiArticlesBatchUpload: function(event) {
      if (event) event.preventDefault();
      var articleData = this.store(zdArticle.key);
      var obj = this.calcResourceNameArticles(articleData);
      var numArticles = obj.articles.length;
      var article, resource_request, txResourceName;
      for (var i = 0; i < numArticles; i++) {
        article = obj.articles[i];
        txResourceName = article.resource_name;
        resource_request = {};
        if (io.hasFeature('html-tx-resource')) {
          resource_request = common.txRequestHTML(article);
        } else {
          resource_request = common.getTxRequest(article);
        }
        this.loadSyncPage = this.uiArticlesUpsertComplete;
        io.pushSync(txResource.key + txResourceName + 'upsert');
        this.txUpsertResource(resource_request, txResourceName);
      }
    },
    uiArticlesBatchDownload: function(event) {
      if (event) event.preventDefault();
      var project = this.store(txProject.key);
      var sourceLocale = txProject.getSourceLocale(project);
      var articleData = this.store(zdArticle.key);
      var obj = this.calcResourceNameArticles(articleData);
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
              this.zdUpsertArticlesTranslation(translation.content, article.id,
                zdLocale);
            }
          }
        }
      }
    },
    uiArticlesSync: function(event) {
      if (event) event.preventDefault();
      this.asyncGetTxProject();
      this.asyncGetZdArticlesFull(syncArticles.currentpage, syncArticles.sortby,
        syncArticles.sortdirection, syncArticles.perpage);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiArticlesInit;
    },
    uiArticlesDownloadCompletedTranslations: function(event) {
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
            this.zdUpsertArticlesTranslation(translation.content, zdObjectId,
              zdLocale);
          }
        }
      }
    },
    uiArticlesUpsert: function(event) {
      if (event) event.preventDefault();
      var linkId = "#" + event.target.id;
      var txResourceName = this.$(linkId).attr("data-resource");
      var zdObjectId = this.$(linkId).attr("data-zd-object-id");
      var zdObjectType = this.$(linkId).attr("data-zd-object-type");
      var articles = this.store(zdArticle.key);
      var article = this.getSingleArticle(zdObjectId, articles);
      var resource_request = {};
      if (io.hasFeature('html-tx-resource')) {
        resource_request = common.txRequestHTML(article);
      } else {
        resource_request = common.getTxRequest(article);
      }
      this.loadSyncPage = this.uiArticlesUpsertComplete;
      io.pushSync(txResource.key + txResourceName + 'upsert');
      this.txUpsertResource(resource_request, txResourceName);
    },
    uiArticlesUpsertComplete: function() {
      logger.debug('reload TxProject');
      this.asyncGetTxProject();
    },
    uiArticlesPerPage: function(event) {
      if (event) event.preventDefault();
      syncArticles.perpage = this.$(event.target).closest('[perpage]').attr('perpage');
      syncArticles.currentpage = '1';
      this.asyncGetZdArticlesFull(syncArticles.currentpage, syncArticles.sortby,
        syncArticles.sortdirection, syncArticles.perpage);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiArticlesInit;
    },
    uiArticlesSortByUpdated: function(event) {
      if (event) event.preventDefault();
      syncArticles.sortby = 'updated_at';
      syncArticles.sortdirection = 'asc';
      syncArticles.currentpage = '1';
      this.asyncGetZdArticlesFull(syncArticles.currentpage, syncArticles.sortby,
        syncArticles.sortdirection);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiArticlesInit;
    },
    uiArticlesSortByTitle: function(event) {
      if (event) event.preventDefault();
      syncArticles.sortby = 'title';
      syncArticles.sortdirection = 'asc';
      syncArticles.currentpage = '1';
      this.asyncGetZdArticlesFull(syncArticles.currentpage, syncArticles.sortby,
        syncArticles.sortdirection);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiArticlesInit;
    },
    uiArticlesResourceStatsComplete: function() {
      logger.debug('uiArticlesResourceStatsComplete');
      var articleData = this.calcResourceNameArticles(this.store(zdArticle.key));
      var numArticles = articleData.articles.length;
      var resourceName, resource;
      for (var i = 0; i < numArticles; i++) {
        resourceName = articleData.articles[i].resource_name;
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

      this.loadSyncPage = this.uiArticlesLanguageComplete;
      this.syncCompletedLanguagesArticles();

    },
    uiArticlesLanguageComplete: function() {
      logger.debug('uiArticlesLanguageComplete');
      var articleData = this.calcResourceNameArticles(this.store(zdArticle.key));
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
              common.activateDownloadButton(this.$, resourceName);
            }
          }
        }
      }

    },
    uiArticlesGotoPage: function(event) {
      if (event) event.preventDefault();
      logger.debug('uiArticlesGotoPage');
      var linkId = "#" + event.target.id;
      var page = this.$(linkId).attr("data-page");
      syncArticles.currentpage = page;
      this.asyncGetZdArticlesFull(syncArticles.currentpage, syncArticles.sortby,
        syncArticles.sortdirection, syncArticles.perpage);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiArticlesInit;
    },
    uiArticlesNextPage: function(event) {
      if (event) event.preventDefault();
      logger.debug('uiArticlesNextPage');
      var linkId = "#" + event.target.id;
      var page = this.$(linkId).attr("data-current-page");
      var nextPage = parseInt(page, 10) + 1;
      syncArticles.currentpage = nextPage;
      this.asyncGetZdArticlesFull(syncArticles.currentpage, syncArticles.sortby,
        syncArticles.sortdirection, syncArticles.perpage);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiArticlesInit;
    },
    uiArticlesPrevPage: function(event) {
      if (event) event.preventDefault();
      logger.debug('uiArticlesPrevPage');
      var linkId = "#" + event.target.id;
      var page = this.$(linkId).attr("data-current-page");
      var prevPage = parseInt(page, 10) - 1;
      syncArticles.currentpage = prevPage;
      this.asyncGetZdArticlesFull(syncArticles.currentpage, syncArticles.sortby,
        syncArticles.sortdirection, syncArticles.perpage);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiArticlesInit;
    },

  },
  actionHandlers: {
    syncArticlesTranslations: function() {
      logger.debug('syncArticlesTranslations started');
      var articleData = this.store(zdArticle.key);
      var OKToGetArticleTranslations = (typeof articleData === 'undefined') ?
        false : true;
      var obj, numArticles;
      if (OKToGetArticleTranslations) {
        obj = this.calcResourceNameArticles(articleData);
        numArticles = obj.articles.length;
        for (var i = 0; i < numArticles; i++) {
          this.asyncGetZdArticlesTranslations(obj.articles[i].id);
        }
      }
    },
    syncResourceStatsArticles: function() {
      logger.debug('syncResourceStatsArticles started');
      var articleData = this.store(zdArticle.key);
      var OKToGetResourceStats = (typeof articleData === 'undefined') ?
        false : true;
      var obj, numArticles;
      if (OKToGetResourceStats) {
        obj = this.calcResourceNameArticles(articleData);
        numArticles = obj.articles.length;
        for (var i = 0; i < numArticles; i++) {
          this.asyncGetTxResourceStats(obj.articles[i].resource_name);
        }
      }
    },
    syncCompletedLanguagesArticles: function() {
      // Requires txProject, zdArticles, and ResourceStats
      logger.debug('syncCompletedLanguagesArticles started');
      // Local function vars
      var articleData = this.calcResourceNameArticles(this.store(zdArticle.key));
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
      var articles = this.calcResourceNameArticles(articleData);
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
      var paginationVisible = this.checkPaginationArticles(articleData);
      if (paginationVisible) {
        var currentPage = this.getCurrentPageArticles(articleData);
        syncArticles.currentpage = currentPage;
        ret = _.extend(ret, {
          page_prev_enabled: this.isFewerArticles(articleData, currentPage),
          page_next_enabled: this.isMoreArticles(articleData, currentPage),
          current_page: this.getCurrentPageArticles(articleData),
          pagination_visible: paginationVisible,
          pages: this.getPagesArticles(articleData)
        });
      }
      return ret;
    },
  },
};

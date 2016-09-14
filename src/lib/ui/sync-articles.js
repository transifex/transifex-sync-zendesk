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
  currentpage: '1',
  events: {
    'click [tab="articles"]': 'uiArticlesTab',
    'click .js-articles.js-goto-page': 'uiArticlesGotoPage',
    'click .js-articles.js-goto-next': 'uiArticlesNextPage',
    'click .js-articles.js-goto-prev': 'uiArticlesPrevPage',
    'click .js-articles.js-sortby-title': 'uiArticlesSortByTitle',
    'click .js-articles.js-sortby-updated_at': 'uiArticlesSortByUpdated',
    'click .js-articles[perpage]': 'uiArticlesPerPage',
    'click .js-articles.js-batch-upload': 'uiArticlesBatchUpload',
    'click .js-articles.js-batch-download': 'uiArticlesBatchDownload',
    'click .js-articles.js-refresh': 'uiArticlesSync'
  },
  eventHandlers: {
    uiArticlesTab: function(event) {
      if (event) event.preventDefault();
      syncArticles.currentpage = '1';
      var sorting = io.getSorting();
      sorting.sortby = 'title';
      sorting.sortdirection = 'asc';
      io.setSorting(sorting);
      this.uiArticlesSync();
    },
    uiArticlesInit: function(event) {
      if (event) event.preventDefault();
      logger.debug('uiArticlesInit');

      if (io.getPageError()) {
        this.switchTo('loading_page', {
          page: 'articles',
          page_articles: true,
          error: true,
          login_error: io.getPageError().split(':')[1] === 'login',
          transifex_error: io.getPageError().split(':')[0] === 'txProject',
          zendesk_error: io.getPageError().split(':')[0] === 'zdSync',
        });
        return;
      }

      var pageData = this.buildSyncPageArticlesData();
      this.switchTo('sync_page', {
        page: 'articles',
        page_articles: true,
        dataset: pageData,
      });

      var sorting = io.getSorting();
      this.$('.js-sortby-' + sorting.sortby).addClass("is-active");
      this.$('[perpage="' + sorting.perpage + '"]').addClass('is-active');
      this.$('.js-goto-page[data-page="' + syncArticles.currentpage + '"]').addClass('is-active');

      this.loadSyncPage = this.uiArticlesResourceStatsComplete;
      this.syncResourceStatsArticles();
      this.syncArticlesTranslations();
    },
    uiArticlesBatchUpload: function(event) {
      if (event) event.preventDefault();
      var articleData = this.store(zdArticle.key),
          obj = this.calcResourceNameArticles(articleData),
          numArticles = obj.articles.length,
          article, resource_request, txResourceName;
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
      var project = this.store(txProject.key),
          sourceLocale = txProject.getSourceLocale(project),
          articleData = this.store(zdArticle.key),
          obj = this.calcResourceNameArticles(articleData),
          numArticles = obj.articles.length,
          article, resource, txResourceName, completedLocales,
          zdLocale, translation;
      for (var i = 0; i < numArticles; i++) {
        article = obj.articles[i];
        txResourceName = article.resource_name;
        resource = this.store(txResource.key + txResourceName);
        completedLocales = this.completedLanguages(resource);

        for (var ii = 0; ii < completedLocales.length; ii++) { // iterate through list of locales
          if (sourceLocale !== completedLocales[ii]) { // skip the source locale
            translation = this.store(txResource.key + txResourceName + completedLocales[ii]);
            if (typeof translation.content === 'string') {
              zdLocale = syncUtil.txLocaletoZd(completedLocales[ii]);
              this.zdUpsertArticlesTranslation(translation.content, article.id, zdLocale);
            }
          }
        }
      }
    },
    uiArticlesSync: function(event) {
      if (event) event.preventDefault();
      var sorting = io.getSorting();
      io.setPageError(null);
      this.asyncGetTxProject();
      this.asyncGetZdArticlesFull(
        syncArticles.currentpage, sorting.sortby,
        sorting.sortdirection, sorting.perpage
      );
      this.switchTo('loading_page', { page_articles: true, page: 'articles' });
      this.loadSyncPage = this.uiArticlesInit;
    },
    uiArticlesDownloadCompletedTranslations: function(event) {
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
            this.zdUpsertArticlesTranslation(translation.content, zdObjectId, zdLocale);
          }
        }
      }
    },
    uiArticlesUpsert: function(event) {
      if (event) event.preventDefault();
      var linkId = "#" + event.target.id,
          txResourceName = this.$(linkId).attr("data-resource"),
          zdObjectId = this.$(linkId).attr("data-zd-object-id"),
          zdObjectType = this.$(linkId).attr("data-zd-object-type"),
          articles = this.store(zdArticle.key),
          article = this.getSingleArticle(zdObjectId, articles),
          resource_request = {};
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
      var sorting = io.getSorting();
      sorting.perpage = this.$(event.target).closest('[perpage]').attr('perpage');
      io.setSorting(sorting);
      syncArticles.currentpage = '1';
      this.asyncGetZdArticlesFull(
        syncArticles.currentpage, sorting.sortby,
        sorting.sortdirection, sorting.perpage
      );
      this.switchTo('loading_page', { page_articles: true, page: 'articles' });
      this.loadSyncPage = this.uiArticlesInit;
    },
    uiArticlesSortByUpdated: function(event) {
      if (event) event.preventDefault();
      var sorting = io.getSorting();
      if (sorting.sortby == 'updated_at') return;
      sorting.sortby = 'updated_at';
      sorting.sortdirection = 'desc';
      io.setSorting(sorting);
      syncArticles.currentpage = '1';
      this.asyncGetZdArticlesFull(
        syncArticles.currentpage, sorting.sortby,
        sorting.sortdirection, sorting.perpage
      );
      this.switchTo('loading_page', { page_articles: true, page: 'articles' });
      this.loadSyncPage = this.uiArticlesInit;
    },
    uiArticlesSortByTitle: function(event) {
      if (event) event.preventDefault();
      var sorting = io.getSorting();
      if (sorting.sortby == 'title') return;
      sorting.sortby = 'title';
      sorting.sortdirection = 'asc';
      syncArticles.currentpage = '1';
      this.asyncGetZdArticlesFull(
        syncArticles.currentpage, sorting.sortby,
        sorting.sortdirection, sorting.perpage
      );
      this.switchTo('loading_page', { page_articles: true, page: 'articles' });
      this.loadSyncPage = this.uiArticlesInit;
    },
    uiArticlesResourceStatsComplete: function() {
      logger.debug('uiArticlesResourceStatsComplete');
      var articleData = this.calcResourceNameArticles(this.store(zdArticle.key)),
          numArticles = articleData.articles.length,
          resourceName, resource;
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
      var articleData = this.calcResourceNameArticles(this.store(zdArticle.key)),
          numArticles = articleData.articles.length,
          numLanguages = 0,
          resourceName = '',
          resource = {},
          languageArray = [],
          resourceLanguage = {};
      for (var i = 0; i < numArticles; i++) {
        resourceName = articleData.articles[i].resource_name;
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
    uiArticlesGotoPage: function(event) {
      if (event) event.preventDefault();
      logger.debug('uiArticlesGotoPage');
      var page = this.$(event.target).attr("data-page"),
          sorting = io.getSorting();
      syncArticles.currentpage = page;
      this.asyncGetZdArticlesFull(
        syncArticles.currentpage, sorting.sortby,
        sorting.sortdirection, sorting.perpage
      );
      this.switchTo('loading_page', { page_articles: true, page: 'articles' });
      this.loadSyncPage = this.uiArticlesInit;
    },
    uiArticlesNextPage: function(event) {
      if (event) event.preventDefault();
      logger.debug('uiArticlesNextPage');
      var page = this.$(event.target).attr("data-current-page"),
          nextPage = parseInt(page, 10) + 1,
          sorting = io.getSorting();
      syncArticles.currentpage = nextPage;
      this.asyncGetZdArticlesFull(
        syncArticles.currentpage, sorting.sortby,
        sorting.sortdirection, sorting.perpage
      );
      this.switchTo('loading_page', { page_articles: true, page: 'articles' });
      this.loadSyncPage = this.uiArticlesInit;
    },
    uiArticlesPrevPage: function(event) {
      if (event) event.preventDefault();
      logger.debug('uiArticlesPrevPage');
      var page = this.$(event.target).attr("data-current-page"),
          prevPage = parseInt(page, 10) - 1,
          sorting = io.getSorting();
      syncArticles.currentpage = prevPage;
      this.asyncGetZdArticlesFull(
        syncArticles.currentpage, sorting.sortby,
        sorting.sortdirection, sorting.perpage
      );
      this.switchTo('loading_page', { page_articles: true, page: 'articles' });
      this.loadSyncPage = this.uiArticlesInit;
    },
  },
  actionHandlers: {
    syncArticlesTranslations: function() {
      logger.debug('syncArticlesTranslations started');
      var articleData = this.store(zdArticle.key),
          OKToGetArticleTranslations = (typeof articleData === 'undefined') ? false : true,
          obj, numArticles;
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
      var articleData = this.store(zdArticle.key),
          OKToGetResourceStats = (typeof articleData === 'undefined') ? false : true,
          obj, numArticles;
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
      var articleData = this.calcResourceNameArticles(this.store(zdArticle.key)),
          numArticles = articleData.articles.length,
          numLanguages = 0,
          resourceName = '',
          resource = {},
          languageArray = [];
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
      var articleData = this.store(zdArticle.key),
          articles = this.calcResourceNameArticles(articleData),
          type = 'articles',
          limit = articles.articles.length,
          ret = [],
          d, e, s,
          tx_completed, zd_object_url, tx_resource_url, zd_object_updated;
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

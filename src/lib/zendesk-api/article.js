/**
 * The Zendesk resource API gets article data
 * from an existing project.
 * @module zendesk-api/articles
 */

var common = require('../common');

var article = module.exports = {
  // selfies
  key: 'zd_article',
  base_url: '/api/v2/help_center/',
  timeout: 500,
  logging: true,
  STRING_RADIX: 10,
  events: {
    'zdArticles.done': 'zdArticlesDone',
    'zdArticlesFull.done': 'zdArticlesDone',
    'zdArticleGetTranslations.done': 'zdArticleGetTranslationsDone',
    'zdArticleUpdate.done': 'zdArticleUpdateDone',
    'zdArticleInsert.done': 'zdArticleInsertDone',
    'zdArticleGetTranslations.fail': 'zdArticleSyncError',
    'zdArticles.fail': 'zdArticleSyncError',
    'zdArticlesFull.fail': 'zdArticleSyncError',
  },
  requests: {
    zdArticles: function() {
      return {
        url: article.base_url + 'articles.json' + "?per_page=7",
        type: 'GET',
        dataType: 'json'
      };
    },
    zdArticlesFull: function(page, sortby, sortdirection, numperpage) {
      var numberperpageString = "";
      if (numperpage) {
        numberperpageString = "?per_page=" + numperpage;
      } else {
        numberperpageString = "?per_page=7";
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
        url: article.base_url + 'en-us/articles.json' + numberperpageString +
          pageString + sortbyString + sortdirectionString,
        type: 'GET',
        dataType: 'json'
      };
    },
    zdArticlesSLTranslations: function() {
      return {
        url: article.base_url + '/articles.json?include=translations',
        type: 'GET',
        dataType: 'json'
      };
    },
    zdArticleGetTranslations: function(id) {
      return {
        url: article.base_url + 'articles/' + id + '/translations',
        type: 'GET',
        beforeSend: function(jqxhr, settings) {
          jqxhr.id = id;
        },
        contentType: 'application/json'
      };
    },
    zdArticleInsert: function(data, articleId) {
      return {
        url: article.base_url + 'articles/' + articleId +
          '/translations.json',
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json'
      };
    },
    zdArticleUpdate: function(data, id, locale) {
      return {
        url: article.base_url + 'articles/' + id + '/translations/' +
          locale + '.json',
        type: 'PUT',
        data: JSON.stringify(data),
        contentType: 'application/json'
      };
    },
  },
  eventHandlers: {
    zdArticlesDone: function(data, textStatus) {
      if (article.logging) {
        console.log('Zendesk Articles retrieved with status:' + textStatus);
      }
      this.store(article.key, data);
      console.log('done, removing key');
      this.syncStatus = _.without(this.syncStatus, article.key);
      this.checkAsyncComplete();
    },
    zdArticleSyncError: function(jqXHR, textStatus) {
      if (article.logging) {
        console.log('Zendesk Article Retrieved with status:' + textStatus);
      }
      this.syncStatus = _.without(this.syncStatus, article.key);
      this.checkAsyncComplete();
      //this.uiErrorPageInit();
      if (jqXHR.status === 401) {
        console.log('login error');
        //this.updateMessage("txLogin", "error");
      }
    },
    zdArticleGetTranslationsDone: function(data, textStatus, jqXHR) {
      if (article.logging) {
        console.log('Zendesk Article Translations retrieved with status:' +
          textStatus);
      }
      this.syncStatus = _.without(this.syncStatus, article.key + jqXHR.id);
      this.checkAsyncComplete();
    },
    zdArticleInsertDone: function(data, textStatus) {
      console.log('Transifex Resource inserted with status:' + textStatus);
    },
    zdArticleUpdateDone: function(data, textStatus) {
      console.log('Transifex Resource updated with status:' + textStatus);
    },
  },
  actionHandlers: {
    displayArticles: function() {
      var pageData = this.store(article.key);
      pageData = [pageData];
      this.switchTo('sync_articles', {
        dataset: pageData,
      });
    },
    zdUpsertArticleTranslation: function(resource_data, article_id, zdLocale) {
      if (article.logging) {
        console.log('Upsert Article with Id:' + article_id + 'and locale:' +
          zdLocale);
      }

      /* var localeRegion = zdLocale.split('-');
       if (localeRegion.length > 1 && localeRegion[0] == localeRegion[1]) {
         zdLocale = localeRegion[0];
       }
       */
      var translationData;
      if (this.featureConfig('html-tx-resource')) {
        translationData = common.translationObjectFormat(this.featureConfig,
          resource_data, zdLocale);
      } else {
        translationData = common.translationObjectFormat(this.featureConfig,
          resource_data, zdLocale);
      }
      /*
      var i = _.findIndex(locales, {
        id: parseInt(article_id, 10)
      });
      */
      var translations = this.store(article.key + article_id);
      var checkLocaleExists = (typeof translations[zdLocale] ===
        'undefined') ? false : true;
      if (checkLocaleExists) {
        this.ajax('zdArticleUpdate', translationData, article_id, zdLocale);
      } else {
        this.ajax('zdArticleInsert', translationData, article_id);
      }
    },
    asyncGetZdArticles: function() {
      if (article.logging) {
        console.log('function: [asyncGetZdArticles]');
      }
      this.syncStatus.push(article.key);
      var that = this;
      setTimeout(
        function() {
          that.ajax('zdArticles');
        }, article.timeout);
    },
    asyncGetZdArticleTranslations: function(id) {
      if (article.logging) {
        console.log('function: [asyncGetZdArticleTranslation]');
      }
      this.syncStatus.push(article.key + id);
      var that = this;
      setTimeout(
        function() {
          that.ajax('zdArticleGetTranslations', id);
        }, article.timeout);
    },
    asyncGetZdArticlesFull: function(page, sortby, sortdirection, numperpage) {
      if (article.logging) {
        console.log('function: [asyncGetZdArticlesFull] params: [page]' +
          page + '[sortby]' + sortby + '[sortdirection]' + sortdirection +
          '[numperpage]' + numperpage);
      }
      this.syncStatus.push(article.key);
      var that = this;
      setTimeout(
        function() {
          that.ajax('zdArticlesFull', page, sortby, sortdirection,
            numperpage);
        }, article.timeout);
    },

  },
  jsonHandlers: {
    getSingle: function(id, a) {
      if (typeof id == 'string' || id instanceof String)
        id = parseInt(id, article.STRING_RADIX);
      var i = _.findIndex(a.articles, {
        id: id
      });
      return a.articles[i];
    },
    calcResourceName: function(obj) {
      var ret = obj.articles;
      var type = 'articles';
      if (this.featureConfig('html-tx-resource')) {
        type = 'HTML-' + type;
      }
      var typeString = type + '-';
      // Get the array key and use it as a type
      var limit = obj.articles.length;
      for (var i = 0; i < limit; i++) {
        ret[i] = _.extend(ret[i], {
          resource_name: typeString + ret[i].id
        });
      }
      return {
        articles: ret
      };
    },
    getName: function(id, a) {
      if (a.articles instanceof Array) {
        var i = _.findIndex(a.articles, {
          id: id
        });
        return a.articles[i]["name"];
      } else {
        return a.name;
      }

    },
    getTitle: function(id, a) {
      if (a.articles instanceof Array) {
        var i = _.findIndex(a.articles, {
          id: id
        });
        return a.articles[i]["title"];
      } else {
        return a.title;
      }
    },
    getBody: function(id, a) {
      if (a.articles instanceof Array) {
        var i = _.findIndex(a.articles, {
          id: id
        });
        return a.articles[i]["body"];
      } else {
        return a.body;
      }
    },
    checkPagination: function(a) {
      var i = a.page_count;
      console.log(a);
      console.log(i);
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

    getPages: function(a) {
      var i = a.page_count;
      return _.range(1, i + 1);
    },
    getCurrentPage: function(a) {
      var i = a.page;
      return i;
    },
    isFewer: function(a, i) {
      if (i > 1) {
        return true;
      }
      return false;
    },
    isMore: function(a, i) {
      if (a.page_count > i) {
        return true;
      }
      return false;
    },
  }
};

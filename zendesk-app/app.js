(function() {
  var myUtil = require('syncUtil');
  var myTxProject = require('txProject');
  var myZdArticles = require('zdArticles');
  var myZdSections = require('zdSections');
  var myZdTranslations = require('zdTranslations');
  var myZdCategories = require('zdCategories');
  var myMessages = require('messages');
  return txApp(myUtil, myTxProject, myZdArticles, myZdSections, myZdTranslations, myZdCategories, myMessages);
}());

if (typeof exports !== 'undefined') {
  exports.txApp = txApp();
}

function txApp(util, txProject, zdArticles, zdSections, zdTranslations, zdCategories, messages) {

  return {
    requests: {

      txProject: function(pageString) {
        return {
          url: txProject.url + '?details',
          type: 'GET',
          beforeSend: function(jqxhr, settings) {
            jqxhr.page = pageString;
          },
          dataType: 'json',
          username: this.settings.tx_username,
          password: this.settings.tx_password,
          timeout: txProject.timeout,
          secure: txProject.secure
        };
      },
      txResourceStats: function(resourceName) {
        return {
          url: txProject.url + 'resource/' + resourceName + '/stats/',
          type: 'GET',
          beforeSend: function(jqxhr, settings) {
            jqxhr.resourceName = resourceName;
          },
          dataType: 'json',
          username: this.settings.tx_username,
          password: this.settings.tx_password,
          timeout: txProject.timeout,
          secure: txProject.secure
        };
      },
      txResource: function(resourceName, languageCode) {
        return {
          url: txProject.url + 'resource/' + resourceName + '/translation/' + languageCode + '/',
          type: 'GET',
          beforeSend: function(jqxhr, settings) {
            jqxhr.resourceName = resourceName;
            jqxhr.languageCode = languageCode;
          },
          dataType: 'json',
          username: this.settings.tx_username,
          password: this.settings.tx_password,
          timeout: txProject.timeout,
          secure: txProject.secure
        };
      },
      txInsert: function(data) {
        return {
          url: txProject.url + 'resources/',
          type: 'POST',
          username: this.settings.tx_username,
          password: this.settings.tx_password,
          data: JSON.stringify(data),
          contentType: 'application/json',
          timeout: txProject.timeout,
          secure: txProject.secure
        };
      },
      txUpdate: function(data, resourceName) {
        return {
          url: txProject.url + 'resource/' + resourceName + '/content',
          type: 'PUT',
          username: this.settings.tx_username,
          password: this.settings.tx_password,
          data: JSON.stringify(data),
          contentType: 'application/json',
          timeout: txProject.timeout,
          secure: txProject.secure
        };
      },
      txInsertSection: function(data) {
        return {
          url: txProject.url + 'resources/',
          type: 'POST',
          username: this.settings.tx_username,
          password: this.settings.tx_password,
          data: JSON.stringify(data),
          contentType: 'application/json',
          timeout: txProject.timeout,
          secure: txProject.secure
        };
      },
      txUpdateSection: function(data, resourceName) {
        return {
          url: txProject.url + 'resource/' + resourceName + '/content',
          type: 'PUT',
          username: this.settings.tx_username,
          password: this.settings.tx_password,
          data: JSON.stringify(data),
          contentType: 'application/json',
          timeout: txProject.timeout,
          secure: txProject.secure
        };
      },
      txInsertCategory: function(data) {
        return {
          url: txProject.url + 'resources/',
          type: 'POST',
          username: this.settings.tx_username,
          password: this.settings.tx_password,
          data: JSON.stringify(data),
          contentType: 'application/json',
          timeout: txProject.timeout,
          secure: txProject.secure
        };
      },
      txUpdateCategory: function(data, resourceName) {
        return {
          url: txProject.url + 'resource/' + resourceName + '/content',
          type: 'PUT',
          username: this.settings.tx_username,
          password: this.settings.tx_password,
          data: JSON.stringify(data),
          contentType: 'application/json',
          timeout: txProject.timeout,
          secure: txProject.secure
        };
      },
      zdArticles: function(pageString) {
        return {
          url: '/api/v2/help_center/articles.json?per_page=7' + pageString,
          type: 'GET',
          dataType: 'json'
        };
      },
      zdSections: function(pageString) {
        return {
          url: '/api/v2/help_center/sections.json?per_page=7' + pageString,
          type: 'GET',
          dataType: 'json'
        };
      },
      zdCategories: function(pageString) {
        return {
          url: '/api/v2/help_center/categories.json?per_page=7' + pageString,
          type: 'GET',
          dataType: 'json'
        };
      },
      zdArticlesSLTranslations: function() {
        return {
          url: '/api/v2/help_center/articles.json?include=translations',
          type: 'GET',
          dataType: 'json'
        };
      },
      zdArticleGetTranslations: function(articleId) {
        return {
          url: '/api/v2/help_center/articles/' + articleId + '/translations',
          type: 'GET',
          beforeSend: function(jqxhr, settings) {
            jqxhr.articleId = articleId;
          },
          contentType: 'application/json'
        };
      },
      zdSectionGetTranslations: function(sectionId) {
        return {
          url: '/api/v2/help_center/sections/' + sectionId + '/translations',
          type: 'GET',
          beforeSend: function(jqxhr, settings) {
            jqxhr.sectionId = sectionId;
          },
          contentType: 'application/json'
        };
      },
      zdCategoryGetTranslations: function(categoryId) {
        return {
          url: '/api/v2/help_center/categories/' + categoryId + '/translations',
          type: 'GET',
          beforeSend: function(jqxhr, settings) {
            jqxhr.categoryId = categoryId;
          },
          contentType: 'application/json'
        };
      },
      zdArticleInsert: function(data, articleId) {
        return {
          url: '/api/v2/help_center/articles/' + articleId + '/translations.json',
          type: 'POST',
          data: JSON.stringify(data),
          contentType: 'application/json'
        };
      },
      zdArticleUpdate: function(data, id, locale) {
        return {
          url: '/api/v2/help_center/articles/' + id + '/translations/' + locale + '.json',
          type: 'PUT',
          data: JSON.stringify(data),
          contentType: 'application/json'
        };
      },
      zdSectionInsert: function(data, sectionId) {
        return {
          url: '/api/v2/help_center/sections/' + sectionId + '/translations.json',
          type: 'POST',
          data: JSON.stringify(data),
          contentType: 'application/json'
        };
      },
      zdSectionUpdate: function(data, id, locale) {
        return {
          url: '/api/v2/help_center/sections/' + id + '/translations/' + locale + '.json',
          type: 'PUT',
          data: JSON.stringify(data),
          contentType: 'application/json'
        };
      },
      zdCategoryInsert: function(data, categoryId) {
        return {
          url: '/api/v2/help_center/categories/' + categoryId + '/translations.json',
          type: 'POST',
          data: JSON.stringify(data),
          contentType: 'application/json'
        };
      },
      zdCategoryUpdate: function(data, id, locale) {
        return {
          url: '/api/v2/help_center/categories/' + id + '/translations/' + locale + '.json',
          type: 'PUT',
          data: JSON.stringify(data),
          contentType: 'application/json'
        };
      }

    },
    messages: {
      'txUpdateDone': {
        success: 'Transifex resource updated',
        fail: 'Transifex resource update failed'
      },
      'txInsertDone': {
        success: 'Transifex resource created',
        fail: 'Transifex resource creation failed'
      },
      'zdArticleUpdateDone': {
        success: 'Translations updated',
        fail: 'Translation update failed'
      },
      'zdArticleInsertDone': {
        success: 'Translations created',
        fail: 'Translation download failed'
      },
      'zdSectionUpdateDone': {
        success: 'Translations updated',
        fail: 'Translation update failed'
      },
      'zdSectionInsertDone': {
        success: 'Translations created',
        fail: 'Translation download failed'
      },
      'zdCategoryUpdateDone': {
        success: 'Translations updated',
        fail: 'Translation update failed'
      },
      'zdCategoryInsertDone': {
        success: 'Translations created',
        fail: 'Translation download failed'
      },
      'syncUpload': {
        success: 'Sync process initiated',
        fail: 'Sync error detected. Please contact support@transifex.com.'
      },
      'syncDownload': {
        success: 'Sync process initiated',
        fail: 'Missing completed resources. Please complete translation before proceding.'
      },
      'projectUrlConfig': {
        success: 'Project URL succesfully configured!',
        fail: "It looks like the Project URL isn't configured properly. Please update it in the app settings."
      },
      'txLogin': {
        success: 'You successfully authenticated with Transifex.',
        fail: "Login to Transifex failed. Please correct your username or password in the app settings."
      },
    },
    events: {
      'app.activated': 'init',
      'click .page_action_articles': 'uiSyncPageArticlesInit',
      'click .page_action_sections': 'uiSyncPageSectionsInit',
      'click .page_action_categories': 'uiSyncPageCategoriesInit',
      'click .page_action_page': 'uiSyncPageGotoPage',
      'click .page_action_next': 'uiSyncPageNextPage',
      'click .page_action_prev': 'uiSyncPagePrevPage',
      'click .page_action_sync': 'uiSync',
      'zdArticles.done': 'zdArticlesDone',
      'zdSections.done': 'zdSectionsDone',
      'zdCategories.done': 'zdCategoriesDone',
      'txProject.done': 'txProjectDone',
      'txResourceStats.done': 'txResourceStatsDone',
      'txResource.done': 'txResourceDone',
      'txInsert.done': 'txInsertDone',
      'txUpdate.done': 'txUpdateDone',
      'txInsertSection.done': 'txInsertSectionDone',
      'txUpdateSection.done': 'txUpdateSectionDone',
      'txInsertCategory.done': 'txInsertCategoryDone',
      'txUpdateCategory.done': 'txUpdateCategoryDone',
      'zdArticleGetTranslations.done': 'zdArticleGetTranslationsDone',
      'zdSectionGetTranslations.done': 'zdSectionGetTranslationsDone',
      'zdCategoryGetTranslations.done': 'zdCategoryGetTranslationsDone',
      'zdArticleUpdate.done': 'zdArticleUpdateDone',
      'zdArticleInsert.done': 'zdArticleInsertDone',
      'zdSectionUpdate.done': 'zdSectionUpdateDone',
      'zdSectionInsert.done': 'zdSectionInsertDone',
      'zdCategoryUpdate.done': 'zdCategoryUpdateDone',
      'zdCategoryInsert.done': 'zdCategoryInsertDone',

      'txResource.fail': 'syncRetryResource',
      'txResourceStats.fail': 'syncRetryResourceStats',
      'zdArticles.fail': 'syncError',
      'zdSections.fail': 'syncError',
      'zdCategories.fail': 'syncError',
      'txProject.fail': 'syncError',
      'txInsert.fail': 'syncError',
      'txUpdate.fail': 'syncError',
      'txInsertSection.fail': 'syncError',
      'txUpdateSection.fail': 'syncError',
      'txInsertCategory.fail': 'syncError',
      'txUpdateCategory.fail': 'syncError',
      'zdArticleGetTranslations.fail': 'syncError',
      'zdSectionGetTranslations.fail': 'syncError',
      'zdCategoryGetTranslations.fail': 'syncError',
      'zdArticleUpdate.fail': 'syncError',
      'zdArticleInsert.fail': 'syncError',
      'zdSectionUpdate.fail': 'syncError',
      'zdSectionInsert.fail': 'syncError',
      'zdCategoryUpdate.fail': 'syncError',
      'zdCategoryInsert.fail': 'syncError'
    },

    init: function() {
      if (this.isDebug()) {
        this.store(messages.key, messages.init());
      }
      this.store('zd_locales', '');
      this.store('resourceList', '');
      this.store('completed_resources', '');
      var tmp = txProject.convertUrlToApi(this.settings.tx_project);
      var tmpt = txProject.convertTimeoutSetting(this.settings.timeout);
      var tmps = txProject.convertSecureSetting(this.settings.secure);
      if (txProject.checkProjectApiUrl(tmp)) {
        this.txGetProject("");
        this.switchTo('loading_page');

      } else {
        this.uiErrorPageInit();
        this.updateMessage("projectUrlConfig", "fail");
      }
    },

    zdCategoryInsertDone: function(data, textStatus) {
      this.updateMessage("zdCategoryInsertDone", textStatus);
    },

    zdCategoryUpdateDone: function(data, textStatus) {
      this.updateMessage("zdCategoryUpdateDone", textStatus);
    },

    zdSectionInsertDone: function(data, textStatus) {
      this.updateMessage("zdSectionInsertDone", textStatus);
    },

    zdSectionUpdateDone: function(data, textStatus) {
      this.updateMessage("zdSectionUpdateDone", textStatus);
    },

    zdArticleInsertDone: function(data, textStatus) {
      this.updateMessage("zdArticleInsertDone", textStatus);
    },

    zdArticleUpdateDone: function(data, textStatus) {
      this.updateMessage("zdArticleUpdateDone", textStatus);
    },

    txInsertDone: function(data, textStatus) {
      this.updateMessage("txInsertDone", textStatus);
    },

    txUpdateDone: function(data, textStatus) {
      this.updateMessage("txUpdateDone", textStatus);

    },
    txInsertSectionDone: function(data, textStatus) {
      this.updateMessage("txInsertDone", textStatus);
    },

    txUpdateSectionDone: function(data, textStatus) {
      this.updateMessage("txUpdateDone", textStatus);

    },
    txInsertCategoryDone: function(data, textStatus) {
      this.updateMessage("txInsertDone", textStatus);
    },

    txUpdateCategoryDone: function(data, textStatus) {
      this.updateMessage("txUpdateDone", textStatus);

    },

    updateMessage: function(action, status) {
      if (status === "success") {
        this.$("span.message").attr("class", "message label label-success");
        this.$("span.message").text(this.messages[action].success);
      } else {
        if (status == "clear") {
          this.$("span.message").attr("class", "message");
          this.$("span.message").text("");
        } else {
          this.$("span.message").attr("class", "message label label-important");
          this.$("span.message").text(this.messages[action].fail);
        }
      }

    },

    isDebug: function() {
      if (this.settings.debug !== null && this.settings.debug === "1") {
        return true;
      }
      return false;
    },

    syncError: function(jqXHR, textStatus) {
      this.uiErrorPageInit();
      if (jqXHR.status === 401) {
        this.updateMessage("txLogin", "error");
      }
    },

    syncUpload: function(event) {
      if (this.isDebug()) {
        var msg = messages.add('Sync Upload Click', this.store(messages.key));
        this.store(messages.key, msg);
      }

      event.preventDefault();
      var linkId = "#" + event.target.id;
      var txResourceName = this.$(linkId).attr("data-resource");
      var zdObjectId = this.$(linkId).attr("data-zd-object-id");
      var zdObjectType = this.$(linkId).attr("data-zd-object-type");
      var resource_request = {};
      var syncComplete = false;
      if (zdObjectType === "article") {
        var articles = this.store(zdArticles.key);
        var article = zdArticles.getSingle(zdObjectId, articles);
        resource_request = zdArticles.getTxRequest(article);
        this.txUpsertResource(resource_request, txResourceName);
        syncComplete = true;
      }
      if (zdObjectType === "section") {
        var sections = this.store(zdSections.key);
        var section = zdSections.getSingle(zdObjectId, sections);
        resource_request = zdSections.getTxRequest(section);
        this.txUpsertSectionResource(resource_request, txResourceName);
        syncComplete = true;
      }
      if (zdObjectType === "category") {
        var categories = this.store(zdCategories.key);
        var category = zdCategories.getSingle(zdObjectId, categories);
        resource_request = zdCategories.getTxRequest(category);
        this.txUpsertCategoryResource(resource_request, txResourceName);
        syncComplete = true;
      }
      if (!syncComplete) {
        this.updateMessage("syncUpload", "error");
      }

    },

    syncDownload: function(event) {
      if (this.isDebug()) {
        var msg = messages.add('Sync Download Click', this.store(messages.key));
        this.store(messages.key, msg);
      }

      event.preventDefault();

      var project = this.store(txProject.key);
      var source_locale = txProject.getSourceLocale(project);
      // Get Params via JQuery
      var linkId = "#" + event.target.id;
      var txResourceName = this.$(linkId).attr("data-resource");
      var zdObjectId = this.$(linkId).attr("data-zd-object-id");
      var zdObjectType = this.$(linkId).attr("data-zd-object-type");

      var completedResources = this.store('completed_resources'); // get list of locales

      var locales = util.getLocalesFromArray(txResourceName, completedResources);

      var downloadComplete = true; // assume truth for exclusion
      for (var i = 0; i < locales.length; i++) { // iterate through list of locales
        if (source_locale !== locales[i]) { // skip the source locale
          var resourceList = this.store('resourceList');

          var ii = _.findIndex(resourceList, {
            key: txResourceName + '-' + locales[i]
          });
          var localeComplete = false;
          if (parseInt(ii, 10) !== -1) {

            var zdLocale = util.txLocaletoZd(locales[i]);
            if (zdObjectType === "article") {
              this.zdUpsertArticleTranslation(resourceList[ii].value, zdObjectId, zdLocale);
              localeComplete = true;
            }
            if (zdObjectType === "section") {
              this.zdUpsertSectionTranslation(resourceList[ii].value, zdObjectId, zdLocale);
              localeComplete = true;
            }
            if (zdObjectType === "category") {
              this.zdUpsertCategoryTranslation(resourceList[ii].value, zdObjectId, zdLocale);
              localeComplete = true;
            }
          }
          if (!localeComplete) {
            downloadComplete = false;
          }
        }

      }
      if (!downloadComplete) {
        setTimeout(this.updateMessage("syncDownload", "missing-resources"), 6000);
      }

    },
    uiSync: function(event) {
      var linkId = "#" + event.target.id;
      var page = this.$(linkId).attr("data-current-page");
      var type = this.$(linkId).attr("data-type");
      if (type === "articles") {
        this.txGetProject(page);
      }

      if (type === "categories") {
        this.txGetProjectCategories(page);
      }

      if (type === "sections") {
        this.txGetProjectSections(page);
      }

      this.switchTo('loading_page');
    },

    uiSyncPageGotoPage: function(event) {
      if (this.isDebug()) {
        var msg = messages.add('Sync Goto Page', this.store(messages.key));
        this.store(messages.key, msg);
      }

      var linkId = "#" + event.target.id;
      var page = this.$(linkId).attr("data-page");
      var type = this.$(linkId).attr("data-type");
      if (type === "articles") {
        this.txGetProject(page);
      }

      if (type === "categories") {
        this.txGetProjectCategories(page);
      }

      if (type === "sections") {
        this.txGetProjectSections(page);
      }

      this.switchTo('loading_page');

    },
    uiSyncPageNextPage: function(event) {
      if (this.isDebug()) {
        var msg = messages.add('Sync Next Page', this.store(messages.key));
        this.store(messages.key, msg);
      }

      var linkId = "#" + event.target.id;
      var page = this.$(linkId).attr("data-current-page");
      var type = this.$(linkId).attr("data-type");
      var nextPage = parseInt(page, 10) + 1;
      if (type === "articles") {
        this.txGetProject(nextPage);
      }

      if (type === "categories") {
        this.txGetProjectCategories(nextPage);
      }

      if (type === "sections") {
        this.txGetProjectSections(nextPage);
      }

      this.switchTo('loading_page');

    },
    uiSyncPagePrevPage: function(event) {
      if (this.isDebug()) {
        var msg = messages.add('Sync Prev Page', this.store(messages.key));
        this.store(messages.key, msg);
      }

      var linkId = "#" + event.target.id;
      var page = this.$(linkId).attr("data-current-page");
      var type = this.$(linkId).attr("data-type");
      var prevPage = parseInt(page, 10) - 1;
      if (type === "articles") {
        this.txGetProject(prevPage);
      }

      if (type === "categories") {
        this.txGetProjectCategories(prevPage);
      }

      if (type === "sections") {
        this.txGetProjectSections(prevPage);
      }

      this.switchTo('loading_page');

    },
    uiErrorPageInit: function() {
      this.switchTo('error_page');
    },

    uiSyncPageInit: function() {
      var articles = this.store(zdArticles.key);
      var articleArray = zdArticles.getArray(articles);
      this.store('articlearray', articleArray);
      var resources = this.store('completed_resources');

      var pageData = util.mapSyncPage(articleArray, resources, this.settings.tx_project);
      var paginationVisible = zdArticles.checkPagination(articles);
      if (paginationVisible) {
        var currentPage = zdArticles.getCurrentPage(articles);
        pageData = _.extend(pageData, {
          page_prev_enabled: zdArticles.isFewer(articles, currentPage),
          page_next_enabled: zdArticles.isMore(articles, currentPage),
          current_page: zdArticles.getCurrentPage(articles),
          pagination_visible: paginationVisible,
          pages: zdArticles.getPages(articles)
        });
      }

      pageData = _.extend(pageData, {
        type: "articles",
        article_visible: false,
        section_visible: true,
        category_visible: true
      });
      this.switchTo('sync_page', {
        dataset: pageData
      });
    },

    uiSyncPageSectionsInit: function() {
      this.switchTo('loading_page');
      this.txGetProjectSections("");
    },

    uiSyncPageCategoriesInit: function() {
      this.switchTo('loading_page');
      this.txGetProjectCategories("");
    },
    uiSyncPageArticlesInit: function() {
      this.switchTo('loading_page');
      this.txGetProject("");
    },


    uiSyncPageArticles: function() {
      var articles = this.store(zdArticles.key);
      var articleArray = zdArticles.getArray(articles);
      this.store('articlearray', articleArray);
      var resources = this.store('completed_resources');

      var pageData = util.mapSyncPage(articleArray, resources, this.settings.tx_project);
      var paginationVisible = zdArticles.checkPagination(articles);
      if (paginationVisible) {
        var currentPage = zdArticles.getCurrentPage(articles);
        pageData = _.extend(pageData, {
          page_prev_enabled: zdArticles.isFewer(articles, currentPage),
          page_next_enabled: zdArticles.isMore(articles, currentPage),
          current_page: zdArticles.getCurrentPage(articles),
          pagination_visible: paginationVisible,
          pages: zdArticles.getPages(articles)
        });
      }


      pageData = _.extend(pageData, {
        type: "articles",
        article_visible: false,
        section_visible: true,
        category_visible: true

      });
      this.switchTo('sync_page', {
        dataset: pageData
      });
    },
    uiSyncPageSections: function() {
      var sections = this.store(zdSections.key);
      var sectionArray = zdSections.getArray(sections);
      this.store('sectionarray', sectionArray);
      var resources = this.store('completed_resources');

      var pageData = zdSections.mapSyncPage(sectionArray, resources, this.settings.tx_project);
      var paginationVisible = zdSections.checkPagination(sections);
      if (paginationVisible) {
        var currentPage = zdSections.getCurrentPage(sections);
        pageData = _.extend(pageData, {
          page_prev_enabled: zdSections.isFewer(sections, currentPage),
          page_next_enabled: zdSections.isMore(sections, currentPage),
          current_page: zdSections.getCurrentPage(sections),
          pagination_visible: paginationVisible,
          pages: zdSections.getPages(sections)
        });
      }


      pageData = _.extend(pageData, {
        type: "sections",
        article_visible: true,
        section_visible: false,
        category_visible: true
      });
      this.switchTo('sync_page', {
        dataset: pageData
      });
    },
    uiSyncPageCategories: function() {
      var categories = this.store(zdCategories.key);
      var categoryArray = zdCategories.getArray(categories);
      this.store('categoryarray', categoryArray);
      var resources = this.store('completed_resources');

      var pageData = zdCategories.mapSyncPage(categoryArray, resources, this.settings.tx_project);
      var paginationVisible = zdCategories.checkPagination(categories);
      if (paginationVisible) {
        var currentPage = zdCategories.getCurrentPage(categories);
        pageData = _.extend(pageData, {
          page_prev_enabled: zdCategories.isFewer(categories, currentPage),
          page_next_enabled: zdCategories.isMore(categories, currentPage),
          current_page: zdCategories.getCurrentPage(categories),
          pagination_visible: paginationVisible,
          pages: zdCategories.getPages(categories)
        });
      }


      pageData = _.extend(pageData, {
        type: "categories",
        article_visible: true,
        section_visible: true,
        category_visible: false
      });
      this.switchTo('sync_page', {
        dataset: pageData
      });
    },
    syncRetry: function(xhr) {
      console.log(xhr);
    },

    syncRetryResource: function(xhr) {
      this.doSetTimeoutRetryResource(xhr.resourceName, xhr.languageCode);
    },

    doSetTimeoutRetryResource: function(resource, locale) {
      var timeout = 3000;
      setTimeout(function() {
        this.ajax('txResource', resource, locale);
      }.bind(this), timeout);
    },

    syncRetryResourceStats: function(xhr) {
      this.doSetTimeoutRetryResourceStats(xhr.resourceName);
    },

    doSetTimeoutRetryResourceStats: function(resource) {
      var timeout = 3000;
      setTimeout(function() {
        this.ajax('txResourceStats', resource);
      }.bind(this), timeout);
    },

    getArticleStatus: function(id) {
      if (this.isDebug()) {
        var msg = messages.add('Get Status from Article for' + id, this.store(messages.key));
        this.store(messages.key, msg);
      }
      var resource = "articles-" + id;
      this.ajax('txResourceStats', resource);
    },

    getSectionStatus: function(id) {
      if (this.isDebug()) {
        var msg = messages.add('Get Status from Section for' + id, this.store(messages.key));
        this.store(messages.key, msg);
      }
      var resource = "sections-" + id;
      this.ajax('txResourceStats', resource);

    },

    getCategoryStatus: function(id) {
      if (this.isDebug()) {
        var msg = messages.add('Get Status from Category for' + id, this.store(messages.key));
        this.store(messages.key, msg);
      }
      var resource = "categories-" + id;
      this.ajax('txResourceStats', resource);
    },

    zdGetArticleTranslations: function(article_id) {
      if (this.isDebug()) {
        var msg = messages.add('Get Locales from Article for' + article_id, this.store(messages.key));
        this.store(messages.key, msg);
      }

      this.ajax('zdArticleGetTranslations', article_id);

    },
    zdArticleGetTranslationsDone: function(data, textStatus, jqXHR) {
      if (this.isDebug()) {
        var msg = messages.add('Zendesk Article Locales with status:' + textStatus, this.store(messages.key));
        this.store(messages.key, msg);
      }

      var locales = zdTranslations.getLocale(jqXHR.articleId, data);

      var localesArray = this.store('zd_locales'); //check existing locales
      if (localesArray instanceof Array) {
        var i = _.findIndex(localesArray, {
          name: jqXHR.articleId
        });

        if (i === -1) {
          localesArray.push(locales); //add new locales to array
          this.store('zd_locales', localesArray);
        }
      } else {
        this.store('zd_locales', [locales]);
      }
      var linkId = "#" + "upload-" + "articles-" + jqXHR.articleId;

      this.$(linkId).removeClass("disabled");
      this.$(linkId).click(this.syncUpload.bind(this));
      this.$(linkId).css('cursor', 'pointer');

    },

    zdGetSectionTranslations: function(section_id) {
      if (this.isDebug()) {
        var msg = messages.add('Get Locales from Section for' + section_id, this.store(messages.key));
        this.store(messages.key, msg);
      }

      this.ajax('zdSectionGetTranslations', section_id);

    },
    zdSectionGetTranslationsDone: function(data, textStatus, jqXHR) {
      if (this.isDebug()) {
        var msg = messages.add('Zendesk Section Locales with status:' + textStatus, this.store(messages.key));
        this.store(messages.key, msg);
      }
      var locales = zdTranslations.getLocale(jqXHR.sectionId, data);

      var localesArray = this.store('zd_locales'); //check existing locales
      if (localesArray instanceof Array) {
        var i = _.findIndex(localesArray, {
          name: jqXHR.sectionId
        });

        if (i === -1) {
          localesArray.push(locales); //add new locales to array
          this.store('zd_locales', localesArray);
        }
      } else {
        this.store('zd_locales', [locales]);
      }
      var linkId = "#" + "upload-" + "sections-" + jqXHR.sectionId;

      this.$(linkId).removeClass("disabled");
      this.$(linkId).click(this.syncUpload.bind(this));
      this.$(linkId).css('cursor', 'pointer');

    },

    zdGetCategoryTranslations: function(section_id) {
      if (this.isDebug()) {
        var msg = messages.add('Get Locales from Category for' + section_id, this.store(messages.key));
        this.store(messages.key, msg);
      }

      this.ajax('zdCategoryGetTranslations', section_id);

    },
    zdCategoryGetTranslationsDone: function(data, textStatus, jqXHR) {
      if (this.isDebug()) {
        var msg = messages.add('Zendesk Category Locales with status:' + textStatus, this.store(messages.key));
        this.store(messages.key, msg);
      }

      var locales = zdTranslations.getLocale(jqXHR.categoryId, data);

      var localesArray = this.store('zd_locales'); //check existing locales
      if (localesArray instanceof Array) {
        var i = _.findIndex(localesArray, {
          name: jqXHR.categoryId
        });

        if (i === -1) {
          localesArray.push(locales); //add new locales to array
          this.store('zd_locales', localesArray);
        }
      } else {
        this.store('zd_locales', [locales]);
      }
      var linkId = "#" + "upload-" + "categories-" + jqXHR.categoryId;

      this.$(linkId).removeClass("disabled");
      this.$(linkId).click(this.syncUpload.bind(this));
      this.$(linkId).css('cursor', 'pointer');
    },

    txGetProject: function(page) {
      if (this.isDebug()) {
        var msg = messages.add('Get Project from Transifex', this.store(messages.key));
        this.store(messages.key, msg);
      }

      this.ajax('txProject', page);
    },

    txProjectDone: function(data, textStatus, jqXHR) {
      if (this.isDebug()) {
        var msg = messages.add('Transifex Project Retrieved with status:' + textStatus, this.store(messages.key));
        this.store(messages.key, msg);
      }
      this.store(txProject.key, data);
      this.zdGetArticles(jqXHR.page);

    },
    txGetProjectSections: function(page) {
      if (this.isDebug()) {
        var msg = messages.add('Get Project from Transifex', this.store(messages.key));
        this.store(messages.key, msg);
      }

      this.ajax('txProject', page);
    },

    txProjectSectionsDone: function(data, textStatus, jqXHR) {
      if (this.isDebug()) {
        var msg = messages.add('Transifex Project Retrieved with status:' + textStatus, this.store(messages.key));
        this.store(messages.key, msg);
      }
      this.store(txProject.key, data);
      this.zdGetSections(jqXHR.page);

    },
    txGetProjectCategories: function(page) {
      if (this.isDebug()) {
        var msg = messages.add('Get Project from Transifex', this.store(messages.key));
        this.store(messages.key, msg);
      }

      this.ajax('txProject', page);
    },

    txProjectCategoriesDone: function(data, textStatus, jqXHR) {
      if (this.isDebug()) {
        var msg = messages.add('Transifex Project Retrieved with status:' + textStatus, this.store(messages.key));
        this.store(messages.key, msg);
      }
      this.store(txProject.key, data);
      this.zdGetCategories(jqXHR.page);

    },



    txResourceStatsDone: function(data, textStatus, jqXHR) {
      if (this.isDebug()) {
        var msg = messages.add('Transifex Stats Retrieved with status:' + textStatus, this.store(messages.key));
        this.store(messages.key, msg);
      }
      var localesComplete = util.txGetCompletedTranslations(jqXHR.resourceName, data);

      //  if (localesComplete.length > 0) {
      var localesArray = this.store('completed_resources'); //check existing locales
      if (localesArray instanceof Array) {
        var i = _.findIndex(localesArray, {
          name: jqXHR.resourceName
        });

        if (i === -1) {
          localesArray.push(localesComplete); //add new locales to array
          this.store('completed_resources', localesArray);
        }
      } else {
        localesArray = [localesComplete]; // no existing locales so just create
        this.store('completed_resources', [localesComplete]);
      }
      //   }

      var locales = util.getLocalesFromArray(jqXHR.resourceName, localesArray);
      if (locales.length > 0) {
        for (var ii = 0; ii < locales.length; ii++) {
          this.ajax('txResource', jqXHR.resourceName, locales[ii]);
        }
      } else {
        this.uiSyncPageInit();
      }

    },
    zdGetArticles: function(page) {
      if (this.isDebug()) {
        var msg = messages.add('Get Zendesk Articles', this.store(messages.key));
        this.store(messages.key, msg);
      }
      var pageString = "";
      if (page) {
        pageString = '&page=' + page;
      }
      this.ajax('zdArticles', pageString);

    },
    zdGetSections: function(page) {
      if (this.isDebug()) {
        var msg = messages.add('Get Zendesk Sections', this.store(messages.key));
        this.store(messages.key, msg);
      }
      var pageString = "";
      if (page) {
        pageString = '&page=' + page;
      }
      this.ajax('zdSections', pageString);

    },
    zdGetCategories: function(page) {
      if (this.isDebug()) {
        var msg = messages.add('Get Zendesk Categories', this.store(messages.key));
        this.store(messages.key, msg);
      }
      var pageString = "";
      if (page) {
        pageString = '&page=' + page;
      }
      this.ajax('zdCategories', pageString);

    },
    zdSectionsDone: function(data, textStatus) {
      if (this.isDebug()) {
        var msg = messages.add('Zendesk Sections Retrieved with status:' + textStatus, this.store(messages.key));
        this.store(messages.key, msg);
      }
      this.store(zdSections.key, data);
      var limit = data.sections.length;
      if (limit > 10) {
        limit = 10;
      }
      var project = this.store(txProject.key);
      var resources = txProject.getResourceArray(project);
      for (var i = 0; i < limit; i++) {
        var resourceName = 'sections-' + data.sections[i].id;
        if (util.isStringinArray(resourceName, resources)) {
          this.getSectionStatus(data.sections[i].id);
        }
        this.zdGetSectionTranslations(data.sections[i].id);
      }
      this.uiSyncPageSections();
    },

    zdCategoriesDone: function(data, textStatus) {
      if (this.isDebug()) {
        var msg = messages.add('Zendesk Categories Retrieved with status:' + textStatus, this.store(messages.key));
        this.store(messages.key, msg);
      }
      this.store(zdCategories.key, data);
      var limit = data.categories.length;
      if (limit > 10) {
        limit = 10;
      }
      var project = this.store(txProject.key);

      var resources = txProject.getResourceArray(project);
      for (var i = 0; i < limit; i++) {
        var resourceName = 'categories-' + data.categories[i].id;
        if (util.isStringinArray(resourceName, resources)) {

          this.getCategoryStatus(data.categories[i].id);
        }
        this.zdGetCategoryTranslations(data.categories[i].id);
      }
      this.uiSyncPageCategories();
    },

    zdArticlesDone: function(data, textStatus) {
      if (this.isDebug()) {
        var msg = messages.add('Zendesk Articles Retrieved with status:' + textStatus, this.store(messages.key));
        this.store(messages.key, msg);
      }
      data = _.extend(data, {
        inline: this.inline,
        location: this.currentLocation()
      });
      this.store(zdArticles.key, data);
      var limit = data.articles.length;
      if (limit > 10) {
        limit = 10;
      }
      var project = this.store(txProject.key);
      var resources = txProject.getResourceArray(project);

      for (var i = 0; i < limit; i++) {
        var articleId = data.articles[i].id;
        var resourceName = 'articles-' + articleId;
        if (util.isStringinArray(resourceName, resources)) {

          this.doSetTimeoutArticleStatus(articleId, i);

        }
        this.doSetTimeoutArticleTranslations(articleId, i);
      }
      this.uiSyncPageArticles();
    },
    doSetTimeoutArticleStatus: function(id, i) {
      var timeout = this.timeoutOffset(i);
      setTimeout(function() {
        this.getArticleStatus(id);
      }.bind(this), timeout);
    },

    doSetTimeoutArticleTranslations: function(id, i) {
      var timeout = this.timeoutOffsetArticles(i);
      setTimeout(function() {
        this.zdGetArticleTranslations(id);
      }.bind(this), timeout);
    },

    timeoutOffset: function(increment) {
      var max = txProject.timeout;
      var min = txProject.timeout / (increment + 1);
      var ret = Math.random() * (max - min);
      return ret;

    },

    timeoutOffsetArticles: function(increment) {
      var max = zdArticles.timeout;
      var min = zdArticles.timeout / (increment + 1);
      return Math.random() * (max - min) + min;

    },

    txResourceDone: function(data, textStatus, jqXHR) {
      if (this.isDebug()) {
        var msg = messages.add('Transifex Resource Retrieved with status:' + textStatus, this.store(messages.key));
        this.store(messages.key, msg);
      }
      data = _.extend(data, {
        inline: this.inline,
        location: this.currentLocation()
      });
      var resourceList = this.store('resourceList');
      var resourceKey = jqXHR.resourceName + '-' + jqXHR.languageCode;
      var uiResourceKey = jqXHR.resourceName;
      var obj = {
        key: resourceKey,
        value: data
      };
      if (_.isArray(resourceList)) {
        var i = _.findIndex(resourceList, {
          key: resourceKey
        });
        if (i === -1) {
          resourceList.push(obj);
          this.store('resourceList', resourceList);
        }
      } else {
        this.store('resourceList', [obj]);
      }
      var linkId = "#" + "download-" + uiResourceKey;
      this.$(linkId).removeClass("disabled");
      this.$(linkId).click(this.syncDownload.bind(this));
      this.$(linkId).css('cursor', 'pointer');

    },
    txUpsertResource: function(content, slug) {
      if (this.isDebug()) {
        var msg = messages.add('Upsert Resource with Slug:' + slug, this.store(messages.key));
        this.store(messages.key, msg);
      }

      var project = this.store(txProject.key);
      var resources = txProject.getResourceArray(project);
      if (util.isStringinArray(slug, resources)) {

        this.ajax('txUpdate', content, slug);
      } else {
        this.ajax('txInsert', content);
      }
    },
    txUpsertSectionResource: function(content, slug) {
      if (this.isDebug()) {
        var msg = messages.add('Upsert Resource with Slug:' + slug, this.store(messages.key));
        this.store(messages.key, msg);
      }


      var project = this.store(txProject.key);
      var resources = txProject.getResourceArray(project);
      if (util.isStringinArray(slug, resources)) {

        this.ajax('txUpdateSection', content, slug);
      } else {
        this.ajax('txInsertSection', content);
      }
    },

    txUpsertCategoryResource: function(content, slug) {
      if (this.isDebug()) {
        var msg = messages.add('Upsert Resource with Slug:' + slug, this.store(messages.key));
        this.store(messages.key, msg);
      }

      var project = this.store(txProject.key);
      var resources = txProject.getResourceArray(project);
      if (util.isStringinArray(slug, resources)) {

        this.ajax('txUpdateCategory', content, slug);
      } else {
        this.ajax('txInsertCategory', content);
      }
    },

    zdUpsertArticleTranslation: function(resource_data, article_id, zdLocale) {
      if (this.isDebug()) {
        var msg = messages.add('Upsert Article with Id:' + article_id + 'and locale:' + zdLocale, this.store(messages.key));
        this.store(messages.key, msg);
      }
      var localeRegion = zdLocale.split('-');
      if (localeRegion.length > 1 && localeRegion[0] == localeRegion[1]) {
        zdLocale = localeRegion[0];
      }
      var locales = this.store('zd_locales');
      var translationData = util.zdGetTranslationObject(resource_data, zdLocale);
      var i = _.findIndex(locales, {
        id: parseInt(article_id, 10)
      });
      if (i !== -1) {
        var localesArray = locales[i].zd_locale;

        if (util.isStringinArray(zdLocale, localesArray)) {

          this.ajax('zdArticleUpdate', translationData, article_id, zdLocale);
        } else {
          this.ajax('zdArticleInsert', translationData, article_id);
        }
      } else {
        this.ajax('zdArticleInsert', translationData, article_id);
      }
    },
    zdUpsertSectionTranslation: function(resource_data, section_id, zdLocale) {
      if (this.isDebug()) {
        var msg = messages.add('Upsert Section with Id:' + section_id + 'and locale:' + zdLocale, this.store(messages.key));
        this.store(messages.key, msg);
      }

      var locales = this.store('zd_locales');
      var translationData = zdSections.zdGetTranslationObject(resource_data, zdLocale);
      var i = _.findIndex(locales, {
        id: parseInt(section_id, 10)
      });

      if (i !== -1) {
        var localesArray = locales[i].zd_locale;
        if (util.isStringinArray(zdLocale, localesArray)) {

          this.ajax('zdSectionUpdate', translationData, section_id, zdLocale);
        } else {
          this.ajax('zdSectionInsert', translationData, section_id);
        }
      } else {
        this.ajax('zdSectionInsert', translationData, section_id);
      }
    },

    zdUpsertCategoryTranslation: function(resource_data, category_id, zdLocale) {
      if (this.isDebug()) {
        var msg = messages.add('Upsert Category with Id:' + category_id + 'and locale:' + zdLocale, this.store(messages.key));
        this.store(messages.key, msg);
      }

      var locales = this.store('zd_locales');
      var translationData = zdCategories.zdGetTranslationObject(resource_data, zdLocale);
      var i = _.findIndex(locales, {
        id: parseInt(category_id, 10)
      });
      if (i !== -1) {
        var localesArray = locales[i].zd_locale;
        if (util.isStringinArray(zdLocale, localesArray)) {

          this.ajax('zdCategoryUpdate', translationData, category_id, zdLocale);
        } else {
          this.ajax('zdCategoryInsert', translationData, category_id);
        }
      } else {
        this.ajax('zdCategoryInsert', translationData, category_id);
      }
    }
  };
}
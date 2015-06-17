(function() {
  var myUtil = require('syncUtil');
  var myTxProject = require('txProject');
  var myZdArticles = require('zdArticles');
  var myZdSections = require('zdSections');
  var myZdTranslations = require('zdTranslations');
  var myZdCategories = require('zdCategories');
  var myMessages = require('messages');
  return txApp(myUtil, myTxProject, myZdArticles, myZdSections, myZdTranslations, myZdCategories,myMessages);
}());

if (typeof exports !== 'undefined') {
  exports.txApp = txApp();
}

// all dep libraries need to be passed in
// deal with 'this.settings' no idea where 'this' is...brittle - Mjj
function txApp(util, txProject, zdArticles, zdSections, zdTranslations, zdCategories, messages) {

  return {
    requests: {

      txProject: function() {
        return {
          url: 'http://www.transifex.com/api/2/project/'+this.settings.tx_project+'?details',
          type: 'GET',
          dataType: 'json',
          username: this.settings.tx_username,
          password: this.settings.tx_password,
          //        secure: true
        };
      },
      txResourceStats: function(resourceName) {
        return {
          url: 'http://www.transifex.com/api/2/project/'+this.settings.tx_project+'/resource/' + resourceName + '/stats/',
          type: 'GET',
          beforeSend: function(jqxhr, settings) {
            jqxhr.resourceName = resourceName;
          },
          dataType: 'json',
          username: this.settings.tx_username,
          password: this.settings.tx_password,
          //        secure: true
        };
      },
      txResource: function(resourceName, languageCode) {
        return {
          url: 'http://www.transifex.com/api/2/project/'+this.settings.tx_project+'/resource/' + resourceName + '/translation/' + languageCode + '/',
          type: 'GET',
          beforeSend: function(jqxhr, settings) {
            jqxhr.resourceName = resourceName;
            jqxhr.languageCode = languageCode;
          },
          dataType: 'json',
          username: this.settings.tx_username,
          password: this.settings.tx_password,
          //        secure: true
        };
      },
      txInsert: function(data) {
        return {
          url: 'http://www.transifex.com/api/2/project/' + this.settings.tx_project + '/resources/',
          type: 'POST',
          username: this.settings.tx_username,
          password: this.settings.tx_password,
          data: JSON.stringify(data),
          contentType: 'application/json',
          timeout: 6000 // sets timeout to 6 seconds
            //        secure: true
        };
      },
      txUpdate: function(data, resourceName) {
        return {
          url: 'http://www.transifex.com/api/2/project/' + this.settings.tx_project + '/resource/' + resourceName + '/content',
          type: 'PUT',
          username: this.settings.tx_username,
          password: this.settings.tx_password,
          data: JSON.stringify(data),
          contentType: 'application/json',
          timeout: 6000 // sets timeout to 6 seconds
        };
      },
      txInsertSection: function(data) {
        return {
          url: 'http://www.transifex.com/api/2/project/' + this.settings.tx_project + '/resources/',
          type: 'POST',
          username: this.settings.tx_username,
          password: this.settings.tx_password,
          data: JSON.stringify(data),
          contentType: 'application/json',
          timeout: 6000 // sets timeout to 6 seconds
            //        secure: true
        };
      },
      txUpdateSection: function(data, resourceName) {
        return {
          url: 'http://www.transifex.com/api/2/project/' + this.settings.tx_project + '/resource/' + resourceName + '/content',
          type: 'PUT',
          username: this.settings.tx_username,
          password: this.settings.tx_password,
          data: JSON.stringify(data),
          contentType: 'application/json',
          timeout: 6000 // sets timeout to 6 seconds
        };
      },
      zdArticles: function() {
        return {
          url: '/api/v2/help_center/articles.json',
          type: 'GET',
          dataType: 'json',
          username: this.settings.zd_username,
          password: this.settings.zd_password
        };
      },
      zdSections: function() {
        return {
          url: '/api/v2/help_center/sections.json',
          type: 'GET',
          dataType: 'json',
          username: this.settings.zd_username,
          password: this.settings.zd_password
        };
      },
      zdCategories: function() {
        return {
          url: '/api/v2/help_center/categories.json',
          type: 'GET',
          dataType: 'json',
          username: this.settings.zd_username,
          password: this.settings.zd_password
        };
      },
      zdArticlesSLTranslations: function() {
        return {
          url: '/api/v2/help_center/articles.json?include=translations',
          type: 'GET',
          dataType: 'json',
          username: this.settings.zd_username,
          password: this.settings.zd_password
        };
      },
      zdArticleGetTranslations: function(articleId) {
        return {
          url: '/api/v2/help_center/articles/' + articleId + '/translations',
          type: 'GET',
          username: this.settings.zd_username,
          password: this.settings.zd_password,
          contentType: 'application/json'
        };
      },
      zdSectionGetTranslations: function(sectionId) {
        return {
          url: '/api/v2/help_center/sections/' + sectionId + '/translations',
          type: 'GET',
          username: this.settings.zd_username,
          password: this.settings.zd_password,
          contentType: 'application/json'
        };
      },
      zdCategoryGetTranslations: function(categoryId) {
        return {
          url: '/api/v2/help_center/categories/' + categoryId + '/translations',
          type: 'GET',
          username: this.settings.zd_username,
          password: this.settings.zd_password,
          contentType: 'application/json'
        };
      },
      zdArticleInsert: function(data, articleId) {
        return {
          url: '/api/v2/help_center/articles/' + articleId + '/translations.json',
          type: 'POST',
          username: this.settings.zd_username,
          password: this.settings.zd_password,
          data: JSON.stringify(data),
          contentType: 'application/json'
        };
      },
      zdArticleUpdate: function(data, id, locale) {
        return {
          url: '/api/v2/help_center/articles/' + id + '/translations/' + locale + '.json',
          type: 'PUT',
          username: this.settings.zd_username,
          password: this.settings.zd_password,
          data: JSON.stringify(data),
          contentType: 'application/json'
        };
      },
      zdSectionInsert: function(data, sectionId) {
        return {
          url: '/api/v2/help_center/sections/' + sectionId + '/translations.json',
          type: 'POST',
          username: this.settings.zd_username,
          password: this.settings.zd_password,
          data: JSON.stringify(data),
          contentType: 'application/json'
        };
      },
      zdSectionUpdate: function(data, id, locale) {
        return {
          url: '/api/v2/help_center/sections/' + id + '/translations/' + locale + '.json',
          type: 'PUT',
          username: this.settings.zd_username,
          password: this.settings.zd_password,
          data: JSON.stringify(data),
          contentType: 'application/json'
        };
      },
      zdCategoryInsert: function(data, categoryId) {
        return {
          url: '/api/v2/help_center/categories/' + categoryId + '/translations.json',
          type: 'POST',
          username: this.settings.zd_username,
          password: this.settings.zd_password,
          data: JSON.stringify(data),
          contentType: 'application/json'
        };
      },
      zdCategoryUpdate: function(data, id, locale) {
        return {
          url: '/api/v2/help_center/categories/' + id + '/translations/' + locale + '.json',
          type: 'PUT',
          username: this.settings.zd_username,
          password: this.settings.zd_password,
          data: JSON.stringify(data),
          contentType: 'application/json'
        };
      }

    },
    messages: {
      'txUpdateDone': {
        success: 'Transifex resource created',
        fail: 'Transifex resource creatation failed'
      },
      'txInsertDone': {
        success: 'Transifex resource created',
        fail: 'Transifex resource creatation failed'
      },
      'zdArticleUpdateDone': {
        success: 'Zendesk article translation updated',
        fail: 'Zendesk article translation update failed'
      },
      'zdArticleInsertDone': {
        success: 'Zendesk article translation created',
        fail: 'Zendesk article translation failed'
      },
      'zdSectionUpdateDone': {
        success: 'Zendesk article translation updated',
        fail: 'Zendesk article translation update failed'
      },
      'zdSectionInsertDone': {
        success: 'Zendesk section translation created',
        fail: 'Zendesk section translation failed'
      },
      'zdCategoryUpdateDone': {
        success: 'Zendesk category translation updated',
        fail: 'Zendesk category translation update failed'
      },
      'zdCategoryInsertDone': {
        success: 'Zendesk category translation created',
        fail: 'Zendesk category translation failed'
      },
      'syncUpload': {
        success: 'Sync process initiated',
        fail: 'Sync error detected'
      },
    },
    events: {
      'app.activated': 'init',
      'click .nav-pills .txsync': 'sync',
      'click .page_action_upload': 'syncUpload',
      'click .page_action_download': 'syncDownload',
      'click .page_action_articles': 'uiSyncPageArticles',
      'click .page_action_sections': 'uiSyncPageSections',
      'click .page_action_categories': 'uiSyncPageCategories',
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
      'zdArticleUpdate.done': 'zdArticleUpdateDone',
      'zdArticleInsert.done': 'zdArticleInsertDone',
      'zdSectionUpdate.done': 'zdSectionUpdateDone',
      'zdSectionInsert.done': 'zdSectionInsertDone',    
      'zdCategoryUpdate.done': 'zdCategoryUpdateDone',
      'zdCategoryInsert.done': 'zdCategoryInsertDone',
    },

    init: function() {
      this.store(messages.key, messages.init());
      this.txGetProject();
      this.zdGetArticles();
      this.zdGetSections();
      this.zdGetCategories();
      this.switchTo('loading_screen');
    },

    sync: function() {
      this.txGetProject();
      this.zdGetArticles();
      this.zdGetSections();
      this.zdGetCategories();
      this.switchTo('loading_screen');
    },

    zdCategoryInsertDone: function(data, textStatus) {
      this.uiSyncPageSections();
      this.updateMessage("zdCategoryInsertDone", textStatus);
    },

    zdCategoryUpdateDone: function(data, textStatus) {
      this.uiSyncPageSections();
      this.updateMessage("zdCategoryUpdateDone", textStatus);
    },

    zdSectionInsertDone: function(data, textStatus) {
      this.uiSyncPageSections();
      this.updateMessage("zdSectionInsertDone", textStatus);
    },

    zdSectionUpdateDone: function(data, textStatus) {
      this.uiSyncPageSections();
      this.updateMessage("zdSectionUpdateDone", textStatus);
    },

    zdArticleInsertDone: function(data, textStatus) {
      this.uiSyncPageArticles();
      this.updateMessage("zdArticleInsertDone", textStatus);
    },

    zdArticleUpdateDone: function(data, textStatus) {
      this.uiSyncPageArticles();
      this.updateMessage("zdArticleUpdateDone", textStatus);
    },

    txInsertDone: function(data, textStatus) {
      this.uiSyncPageInit();
      this.updateMessage("txInsertDone", textStatus);
    },

    txUpdateDone: function(data, textStatus) {
      this.uiSyncPageInit();
      this.updateMessage("txUpdateDone", textStatus);

    },
    txInsertSectionDone: function(data, textStatus) {
      this.uiSyncPageSections();
      this.updateMessage("txInsertDone", textStatus);
    },

    txUpdateSectionDone: function(data, textStatus) {
      this.uiSyncPageSections();
      this.updateMessage("txUpdateDone", textStatus);

    },

    updateMessage: function(action, status) {
      if (status === "success") {
        this.$("span.message").attr("class", "message label label-success");
        this.$("span.message").text(this.messages[action].success);
      } else {
        this.$("span.message").attr("class", "message label label-important");
        this.$("span.message").text(this.messages[action].fail);
      }

    },

    syncUpload: function(event) {
      var msg = messages.add('Sync Upload Click', this.store(messages.key));
      this.store(messages.key, msg);

      event.preventDefault();
      // Get Params via JQuery
      var linkId = "#" + event.target.id;
      var txResourceName = this.$(linkId).attr("data-resource");
      var zdObjectId = this.$(linkId).attr("data-zd-object-id");
      var zdObjectType = this.$(linkId).attr("data-zd-object-type");
      var resource_request = {};
      if (zdObjectType === "article") {
        var articles = this.store(zdArticles.key);
        var article = zdArticles.getSingle(zdObjectId, articles);
        resource_request = zdArticles.getTxRequest(article);
        this.txUpsertResource(resource_request, txResourceName);
        this.switchTo('loading_screen');
      }
      if (zdObjectType === "section") {
        var sections = this.store(zdSections.key);
        var section = zdSections.getSingle(zdObjectId, sections);
        resource_request = zdSections.getTxRequest(section);
        this.txUpsertSectionResource(resource_request, txResourceName);
        this.switchTo('loading_screen');
      }
      if (zdObjectType === "category") {
        var categories = this.store(zdCategories.key);
        var category = zdCategories.getSingle(zdObjectId, categories);
        resource_request = zdSections.getTxRequest(category);
        this.txUpsertCategoryResource(resource_request, txResourceName);
        this.switchTo('loading_screen');
      }
      this.updateMessage("syncUpload", "error");

    },

    syncDownload: function(event) {
      var msg = messages.add('Sync Download Click', this.store(messages.key));
      this.store(messages.key, msg);
      
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

      for (var i = 0; i < locales.length; i++) { // iterate through list of locales
        if (source_locale !== locales[i]) { // skip the source locale
          var resource_data = this.store(txResourceName + '-' + locales[i]); // Get resource based on resource name
          this.store('tempdebug',txResourceName + '-' + locales[i]);
          if (_.isObject(resource_data)) {
            var zdLocale = util.txLocaletoZd(locales[i]);
            if (zdObjectType === "article") {
              this.zdUpsertArticleTranslation(resource_data, zdObjectId, zdLocale);
              this.switchTo('loading_screen');
            }
            if (zdObjectType === "section") {
              this.zdUpsertSectionTranslation(resource_data, zdObjectId, zdLocale);
              this.switchTo('loading_screen');
            }
            if (zdObjectType === "category") {
              this.zdUpsertCategoryTranslation(resource_data, zdObjectId, zdLocale);
              this.switchTo('loading_screen');
            }
          }
        }
      }
      this.updateMessage("syncUpload", "error");
    },
    uiSyncPageInit: function() {
      var articles = this.store(zdArticles.key);
      var articleArray = zdArticles.getArray(articles);
      this.store('articlearray', articleArray);
      var resources = this.store('completed_resources');

      var pageData = util.mapSyncPage(articleArray, resources, this.settings.tx_project);
      pageData = _.extend(pageData, {
        article_visible: false,
        section_visible: true,
        category_visible: true
      });
      this.switchTo('syncPage', {
        dataset: pageData
      });
    },
    uiSyncPageArticles: function() {
      var articles = this.store(zdArticles.key);
      var articleArray = zdArticles.getArray(articles);
      this.store('articlearray', articleArray);
      var resources = this.store('completed_resources');

      var pageData = util.mapSyncPage(articleArray, resources, this.settings.tx_project);
      pageData = _.extend(pageData, {
        article_visible: false,
        section_visible: true,
        category_visible: true
      });
      this.switchTo('syncPage', {
        dataset: pageData
      });
    },
    uiSyncPageSections: function() {
      var sections = this.store(zdSections.key);
      var sectionArray = zdSections.getArray(sections);
      this.store('sectionarray', sectionArray);
      var resources = this.store('completed_resources');

      var pageData = zdSections.mapSyncPage(sectionArray, resources, this.settings.tx_project);
      pageData = _.extend(pageData, {
        article_visible: true,
        section_visible: false,
        category_visible: true
      });
      this.switchTo('syncPage', {
        dataset: pageData
      });
    },
    uiSyncPageCategories: function() {
      var categories = this.store(zdCategories.key);
      var categoryArray = zdCategories.getArray(categories);
      this.store('categoryarray', categoryArray);
      var resources = this.store('completed_resources');

      var pageData = zdCategories.mapSyncPage(categoryArray, resources, this.settings.tx_project);
      pageData = _.extend(pageData, {
        article_visible: true,
        section_visible: true,
        category_visible: false
      });
      this.switchTo('syncPage', {
        dataset: pageData
      });
    },
    getArticleStatus: function(id) {
      var msg = messages.add('Get Status from Article for' + id, this.store(messages.key));
      this.store(messages.key, msg);

      var resource = zdArticles.createResourceName(id, 'articles', '-');
      var project = this.store(txProject.key);
      if (project) {
        var resources = txProject.getResourceArray(project);
        if (util.isStringinArray(resource, resources)) {

          this.ajax('txResourceStats', resource);
        }
      } else {
        this.init();
      }
      //      this.ajax('zdGetArticleTranslations',id);
    },

    getSectionStatus: function(id) {
      var msg = messages.add('Get Status from Section for' + id, this.store(messages.key));
      this.store(messages.key, msg);

      var resource = zdSections.createResourceName(id, 'sections', '-');
      var project = this.store(txProject.key);
      if (project) {
      var resources = txProject.getResourceArray(project);
      if (util.isStringinArray(resource, resources)) {

        this.ajax('txResourceStats', resource);
      }
    } else {
        this.init();
      }
      //      this.ajax('zdGetArticleTranslations',id);
    },

    getCategoryStatus: function(id) {
      var msg = messages.add('Get Status from Category for' + id, this.store(messages.key));
      this.store(messages.key, msg);

      var resource = zdCategories.createResourceName(id, 'categories', '-');
      var project = this.store(txProject.key);
      if (project) {
      var resources = txProject.getResourceArray(project);
      if (util.isStringinArray(resource, resources)) {

        this.ajax('txResourceStats', resource);
      }
    } else {
        this.init();
      }
      //      this.ajax('zdGetArticleTranslations',id);
    },

    zdGetArticleTranslations: function(article_id) {
      var msg = messages.add('Get Locales from Article for' + article_id, this.store(messages.key));
      this.store(messages.key, msg);

      this.ajax('zdArticleGetTranslations', article_id);

    },
    zdArticleGetTranslationsDone: function(data, textStatus) {
      var msg = messages.add('Zendesk Article Locales with status:' + textStatus, this.store(messages.key));
      this.store(messages.key, msg);

      var locales = zdTranslations.getLocale(data);
      var zdLocales = [];
      zdLocales = _.union(this.store('zd_locales'));
      for (var i = 0; i < locales.length; i++) {
        if (!util.isStringinArray(locales[i], zdLocales)) {
          zdLocales.push(locales[i]);
        }
      }
      this.store('zd_locales', zdLocales);

    },

    zdGetSectionTranslations: function(section_id) {
      var msg = messages.add('Get Locales from Section for' + section_id, this.store(messages.key));
      this.store(messages.key, msg);

      this.ajax('zdSectionGetTranslations', section_id);

    },
    zdSectionGetTranslationsDone: function(data, textStatus) {
      var msg = messages.add('Zendesk Section Locales with status:' + textStatus, this.store(messages.key));
      this.store(messages.key, msg);

      var locales = zdTranslations.getLocale(data);
      var zdLocales = [];
      zdLocales = _.union(this.store('zd_locales'));
      for (var i = 0; i < locales.length; i++) {
        if (!util.isStringinArray(locales[i], zdLocales)) {
          zdLocales.push(locales[i]);
        }
      }
      this.store('zd_locales', zdLocales);

    },

    zdGetCategoryTranslations: function(section_id) {
      var msg = messages.add('Get Locales from Category for' + section_id, this.store(messages.key));
      this.store(messages.key, msg);

      this.ajax('zdCategoryGetTranslations', section_id);

    },
    zdCategoryGetTranslationsDone: function(data, textStatus) {
      var msg = messages.add('Zendesk Category Locales with status:' + textStatus, this.store(messages.key));
      this.store(messages.key, msg);

      var locales = zdTranslations.getLocale(data);
      var zdLocales = [];
      zdLocales = _.union(this.store('zd_locales'));
      for (var i = 0; i < locales.length; i++) {
        if (!util.isStringinArray(locales[i], zdLocales)) {
          zdLocales.push(locales[i]);
        }
      }
      this.store('zd_locales', zdLocales);
    },

    txGetProject: function() {
      var msg = messages.add('Get Project from Transifex', this.store(messages.key));
      this.store(messages.key, msg);

      this.ajax('txProject');
    },
    txProjectDone: function(data, textStatus) {
      var msg = messages.add('Transifex Project Retrieved with status:' + textStatus, this.store(messages.key));
      this.store(messages.key, msg);

      this.store(txProject.key, data);
    },
    txResourceStatsDone: function(data, textStatus, jqXHR) {
      var msg = messages.add('Transifex Stats Retrieved with status:' + textStatus, this.store(messages.key));
      this.store(messages.key, msg);
      var localesComplete = util.txGetCompletedTranslations(jqXHR.resourceName, data);

      var localesArray = this.store('completed_resources'); //check existing locales
      if (localesArray instanceof Array) {
        localesArray.push(localesComplete); //add new locales to array
        this.store('completed_resources', localesArray);
      } else {
        locales = [localesComplete]; // no existing locales so just create
        this.store('completed_resources', [localesComplete]);
      }

      var locales = util.getLocalesFromArray(jqXHR.resourceName, localesArray);
      for (var i = 0; i < locales.length; i++) {

        this.ajax('txResource', jqXHR.resourceName, locales[i]);
      }

    },
    zdGetArticles: function() {
      var msg = messages.add('Get Zendesk Articles', this.store(messages.key));
      this.store(messages.key, msg);
      this.ajax('zdArticles');

    },
    zdGetSections: function() {
      var msg = messages.add('Get Zendesk Sections', this.store(messages.key));
      this.store(messages.key, msg);
      this.ajax('zdSections');

    },
    zdGetCategories: function() {
      var msg = messages.add('Get Zendesk Categories', this.store(messages.key));
      this.store(messages.key, msg);
      this.ajax('zdCategories');

    },
    zdSectionsDone: function(data, textStatus) {
      var msg = messages.add('Zendesk Sections Retrieved with status:' + textStatus, this.store(messages.key));
      this.store(messages.key, msg);
      this.store(zdSections.key, data);
      var limit = data.sections.length;
      if (limit > 10) {
        limit = 10;
      }
      for (var i = 0; i < limit; i++) {
        this.getSectionStatus(data.sections[i].id);
        this.zdGetSectionTranslations(data.sections[i].id);
      }
    },

    zdCategoriesDone: function(data, textStatus) {
      var msg = messages.add('Zendesk Categories Retrieved with status:' + textStatus, this.store(messages.key));
      this.store(messages.key, msg);
      this.store(zdCategories.key, data);
      var limit = data.categories.length;
      if (limit > 10) {
        limit = 10;
      }
      for (var i = 0; i < limit; i++) {
        this.getSectionStatus(data.categories[i].id);
        this.zdGetCategoryTranslations(data.categories[i].id);
      }
    },

    zdArticlesDone: function(data, textStatus) {
      var msg = messages.add('Zendesk Articles Retrieved with status:' + textStatus, this.store(messages.key));
      this.store(messages.key, msg);
      data = _.extend(data, {
        inline: this.inline,
        location: this.currentLocation()
      });
      this.store(zdArticles.key, data);
      var limit = data.articles.length;
      if (limit > 10) {
        limit = 10;
      }
      for (var i = 0; i < limit; i++) {
        this.getArticleStatus(data.articles[i].id);
        this.zdGetArticleTranslations(data.articles[i].id);
      }
    },
    zdGetSectionsDone: function(data, textStatus) {
      var msg = messages.add('Zendesk Sections Retrieved with status:' + textStatus, this.store(messages.key));
      this.store(messages.key, msg);
      data = _.extend(data, {
        inline: this.inline,
        location: this.currentLocation()
      });
      this.store(zdSections.key, data);
      var limit = data.articles.length;
      if (limit > 10) {
        limit = 10;
      }
      for (var i = 0; i < limit; i++) {
        this.getSectionStatus(data.sections[i].id);
        this.zdGetArticleTranslations(data.sections[i].id);
      }
    },

    txResourceDone: function(data, textStatus, jqXHR) {
      var msg = messages.add('Transifex Resource Retrieved with status:' + textStatus, this.store(messages.key));
      this.store(messages.key, msg);
      data = _.extend(data, {
        inline: this.inline,
        location: this.currentLocation()
      });
      var resourceKey = jqXHR.resourceName + '-' + jqXHR.languageCode;
      this.store(resourceKey, data);
      this.uiSyncPageInit();
    },
    txUpsertResource: function(content, slug) {
      var msg = messages.add('Upsert Resource with Slug:' + slug, this.store(messages.key));
      this.store(messages.key, msg);

      var project = this.store(txProject.key);
      var resources = txProject.getResourceArray(project);
      if (util.isStringinArray(slug, resources)) {

        this.ajax('txUpdate', content, slug);
      } else {
        this.ajax('txInsert', content);
      }
    },
    txUpsertSectionResource: function(content, slug) {
      var msg = messages.add('Upsert Resource with Slug:' + slug, this.store(messages.key));
      this.store(messages.key, msg);

      var project = this.store(txProject.key);
      var resources = txProject.getResourceArray(project);
      if (util.isStringinArray(slug, resources)) {

        this.ajax('txUpdateSection', content, slug);
      } else {
        this.ajax('txInsertSection', content);
      }
    },

    txUpsertCategoryResource: function(content, slug) {
      var msg = messages.add('Upsert Resource with Slug:' + slug, this.store(messages.key));
      this.store(messages.key, msg);

      var project = this.store(txProject.key);
      var resources = txProject.getResourceArray(project);
      if (util.isStringinArray(slug, resources)) {

        this.ajax('txUpdateCategory', content, slug);
      } else {
        this.ajax('txInsertCategory', content);
      }
    },

    zdUpsertArticleTranslation: function(resource_data, article_id, zdLocale) {
      var msg = messages.add('Upsert Article with Id:' + article_id + 'and locale:' + zdLocale, this.store(messages.key));
      this.store(messages.key, msg);

      var locales = this.store('zd_locales');
      var translationData = util.zdGetTranslationObject(resource_data, zdLocale);
      if (util.isStringinArray(zdLocale, locales)) {

        this.ajax('zdArticleUpdate', translationData, article_id, zdLocale);
      } else {
        this.ajax('zdArticleInsert', translationData, article_id);
      }
    },
    zdUpsertSectionTranslation: function(resource_data, section_id, zdLocale) {
      var msg = messages.add('Upsert Section with Id:' + section_id + 'and locale:' + zdLocale, this.store(messages.key));
      this.store(messages.key, msg);

      var locales = this.store('zd_locales');
      var translationData = util.zdGetTranslationObject(resource_data, zdLocale);
      if (util.isStringinArray(zdLocale, locales)) {

        this.ajax('zdSectionUpdate', translationData, section_id, zdLocale);
      } else {
        this.ajax('zdSectionInsert', translationData, section_id);
      }
    },

    zdUpsertCategoryTranslation: function(resource_data, category_id, zdLocale) {
      var msg = messages.add('Upsert Category with Id:' + category_id + 'and locale:' + zdLocale, this.store(messages.key));
      this.store(messages.key, msg);

      var locales = this.store('zd_locales');
      var translationData = util.zdGetTranslationObject(resource_data, zdLocale);
      if (util.isStringinArray(zdLocale, locales)) {

        this.ajax('zdCategoryUpdate', translationData, category_id, zdLocale);
      } else {
        this.ajax('zdCategoryInsert', translationData, category_id);
      }
    },

    // generic results page for troubleshooting
    showResult: function(data) {
      data = _.extend(data, {
        inline: this.inline,
        location: this.currentLocation()
      });
      this.switchTo('projectPage', {
        settings: this.settings, // An object that contains all the setting key-value pairs
        email: this.currentUser().email(),
        installation_id: this.installationId(),
        data: JSON.stringify(data)
      });
    }
  };
}
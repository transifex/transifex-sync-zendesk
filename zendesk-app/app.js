(function() {
  var myUtil = require('syncUtil');
  var myTxProject = require('txProject');
  var myZdArticles = require('zdArticles');
  var myZdTranslations = require('zdTranslations');
  var myMessages = require('messages');
  return txApp(myUtil, myTxProject, myZdArticles, myZdTranslations, myMessages);
}());

if (typeof exports !== 'undefined') {
  exports.txApp = txApp();
}

// all dep libraries need to be passed in
// deal with 'this.settings' no idea where 'this' is...brittle - Mjj
function txApp(util, txProject, zdArticles, zdTranslations, messages) {

  return {
    requests: {

      txProject: function() {
        return {
          url: util.replaceWithObject('http://www.transifex.com/api/2/project/%%tx_project%%?details', '%%', this.settings),
          type: 'GET',
          dataType: 'json',
          username: this.settings.tx_username,
          password: this.settings.tx_password,
          //        secure: true
        };
      },
      txResourceStats: function(resourceName) {
        return {
          url: util.replaceWithObject('http://www.transifex.com/api/2/project/%%tx_project%%/resource/' + resourceName + '/stats/', '%%', this.settings),
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
          url: util.replaceWithObject('http://www.transifex.com/api/2/project/%%tx_project%%/resource/' + resourceName + '/translation/' + languageCode + '/', '%%', this.settings),
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
          contentType: 'application/json'
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
          contentType: 'application/json'
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
      }

    },

    events: {
      'app.activated': 'init',
      'click .nav-pills .txsync': 'sync',
      'click .page_action_upload': 'syncUpload',
      'click .page_action_download': 'syncDownload',
      'zdArticles.done': 'zdArticlesDone',
      'txProject.done': 'txProjectDone',
      'txResourceStats.done': 'txResourceStatsDone',
      'txResource.done': 'txResourceDone',
      'txInsert.done': 'txInsertDone',
      'txUpdate.done': 'txUpdateDone',
      'zdArticleGetTranslations.done': 'zdArticleGetTranslationsDone'
    },

    //todo create tx done status updates
    init: function() {
      this.store(messages.key, messages.init());
      this.txGetProject();
      this.zdGetArticles();
      //todo
      this.uiSyncPageInit();
      //      this.uiMainPageInit();
    },

    txInsertDone: function() {
//todo update form on success or show error
    },

    txUpdateDone: function() {
//todo update form on success or show error
    },

    syncUpload: function(event) {
      var msg = messages.add('Sync Upload Click', this.store(messages.key));
      this.store(messages.key, msg);
      event.preventDefault();
      // Get Params via JQuery
      var linkId = "#" + event.target.id;
      var txResourceName = $(linkId).attr("data-resource");
      var zdObjectId = $(linkId).attr("data-zd-object");

      var articles = this.store(zdArticles.key); //get all Articles
      var article = zdArticles.getSingle(zdObjectId, articles); // get the article for this event
      var resource_request = zdArticles.getTxRequest(article); //create tx resource request format
      this.store('debuggy', JSON.stringify(article));
      this.txUpsertResource(resource_request, txResourceName); // POST to resource

    },

    syncDownload: function(event) {
      var msg = messages.add('Sync Download Click', this.store(messages.key));
      this.store(messages.key, msg);
      event.preventDefault();

      var project = this.store(txProject.key);
      var source_locale = txProject.getSourceLocale(project);
      // Get Params via JQuery
      var linkId = "#" + event.target.id;
      var txResourceName = $(linkId).attr("data-resource");
      var zdObjectId = $(linkId).attr("data-zd-object");

      var completedResources = this.store('completed_resources'); // get list of locales

      var locales = util.getLocalesFromArray(txResourceName, completedResources);

      for (var i = 0; i < locales.length; i++) { // iterate through list of locales
        if (source_locale !== locales[i]) { // skip the source locale
          var resource_data = this.store(txResourceName + '-' + locales[i]); // Get resource based on resource name

          if (_.isObject(resource_data)) {
            var zdLocale = util.txLocaletoZd(locales[i]);
            this.zdUpsertArticleTranslation(resource_data, zdObjectId, zdLocale);
          }
        }
      }

    },
    uiSyncPageInit: function() {
      var articles = this.store(zdArticles.key);
      var articleArray = zdArticles.getArray(articles);
      this.store('articlearray', articleArray);
      var resources = this.store('completed_resources');

      var pageData = util.mapSyncPage(articleArray, resources, this.settings.tx_project);
      this.switchTo('syncPage', {
        dataset: pageData
      });
    },
    getArticleStatus: function(id) {
      var msg = messages.add('Get Status from Article for' + id, this.store(messages.key));
      this.store(messages.key, msg);

      var resource = zdArticles.createResourceName(id, 'articles', '-');
      var project = this.store(txProject.key);
      var resources = txProject.getResourceArray(project);
      if (util.isStringinArray(resource, resources)) {

        this.ajax('txResourceStats', resource);
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

    txResourceDone: function(data, textStatus, jqXHR) {
      var msg = messages.add('Transifex Resource Retrieved with status:' + textStatus, this.store(messages.key));
      this.store(messages.key, msg);
      data = _.extend(data, {
        inline: this.inline,
        location: this.currentLocation()
      });
      var resourceKey = jqXHR.resourceName + '-' + jqXHR.languageCode;
      this.store(resourceKey, data);
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

    zdUpsertArticleTranslation: function(resource_data, article_id, zdLocale) {
      var msg = messages.add('Upsert Article with Id:' + article_id + 'and locale:' + zdLocale, this.store(messages.key));
      this.store(messages.key, msg);

      var locales = this.store('zd_locales');
      var translationData = util.zdGetTranslationObject(resource_data, zdLocale);
      this.store('moredebuggy', zdLocale + '||' + JSON.stringify(locales));
      if (util.isStringinArray(zdLocale, locales)) {

        this.ajax('zdArticleUpdate', translationData, article_id, zdLocale);
      } else {
        this.ajax('zdArticleInsert', translationData, article_id);
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
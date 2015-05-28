(function() {
  var myUtil = require('util');
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
// TODO deal with 'this.settings' no idea where 'this' is...brittle - Mjj
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
      'app.activated':'init',
      'click .nav-pills .txsync': 'sync',
      'zdArticles.done': 'zdArticlesDone',
      'txProject.done' : 'txProjectDone',
      'txResourceStats.done' : 'txResourceStatsDone',
      'txResource.done': 'txResourceDone',
      'zdArticleGetTranslations.done' : 'zdArticleGetTranslationsDone'
    },

    init: function() {
      this.store(messages.key,messages.init());
      this.uiMainPageInit();
    },

    sync: function(event) {
      var msg = messages.add('Tx Sync Click',this.store(messages.key));
      this.store(messages.key,msg);
      event.preventDefault();
      this.txGetProject();
      var project = this.store(txProject.key);
      this.zdGetArticles();
      var articles = this.store(zdArticles.key);
      if (_.isObject(articles)&&_.isObject(project)) {
        var idList = zdArticles.getIdList(articles);
        
        var source_locale = txProject.getSourceLocale(project);
        var resource = util.createResourceName(idList[2], 'articles', '-');
        var resource_requests = util.txCreateArticleRequests(articles);
        this.txUpsertResource(resource_requests[2],resource);
        this.txGetLocales(resource);
        var locales = this.store('locales');
        for (var i = 0; i < locales.length; i++) {
        if (source_locale !== locales[i])
        if (_.isArray(locales)){
          this.zdGetArticleTranslations(idList[2]);
          this.txGetResource(resource,locales[i]);
          var resource_data = this.store('resource');
          
            if (_.isObject(resource_data)){
              var zdLocale = util.txLocaletoZd(locales[i]);
              this.zdUpsertArticleTranslation(resource_data,idList[2],zdLocale);
            }
        }
      }
    }
      this.uiMainPageUpdate();

      
    },

    uiMainPageInit: function() {
      var msg = messages.add('Displaying Main Page',this.store(messages.key));
      this.store(messages.key,msg);

      this.switchTo('mainPage', {});
      this.uiMainPageUpdate();
    },

    uiMainPageUpdate: function() {
      var msg = messages.add('Updated Main Page',this.store(messages.key));
      this.store(messages.key,msg);

      this.$('.names_cell').html(this.store(messages.key));
    },

    zdGetArticleTranslations: function (article_id) {
      var msg = messages.add('Get Locales from Article for'+article_id,this.store(messages.key));
      this.store(messages.key,msg);

      this.ajax('zdArticleGetTranslations',article_id);

    },
    zdArticleGetTranslationsDone: function(data, textStatus) {
      var msg = messages.add('Zendesk Article Locales with status:'+textStatus,this.store(messages.key));
      this.store(messages.key,msg);
      var locales = zdTranslations.getLocale(data);
      this.store('zd_locales',locales);
    },
    txGetProject: function() {
      var msg = messages.add('Get Project from Transifex',this.store(messages.key));
      this.store(messages.key,msg);

      this.ajax('txProject');
    },

    txGetLocales: function(resource) {
      var msg = messages.add('Get Locales from Transifex',this.store(messages.key));
      this.store(messages.key,msg);

      this.ajax('txResourceStats',resource);

    },
    txProjectDone: function(data, textStatus) {
      var msg = messages.add('Transifex Project Retrieved with status:'+textStatus,this.store(messages.key));
      this.store(messages.key,msg);

      this.store(txProject.key,data);
    },
    txResourceStatsDone: function(data, textStatus) {
      var msg = messages.add('Transifex Stats Retrieved with status:'+textStatus,this.store(messages.key));
      this.store(messages.key,msg);
      var locales = util.txGetCompletedTranslations(data);
      this.store('locales',locales);
    },


    zdGetArticles: function() {
      var msg = messages.add('Get Zendesk Articles',this.store(messages.key));
      this.store(messages.key,msg);
      this.ajax('zdArticles');

    },
    zdArticlesDone: function(data, textStatus) {
      var msg = messages.add('Zendesk Articles Retrieved with status:'+textStatus,this.store(messages.key));
      this.store(messages.key,msg);
      data = _.extend(data, {
        inline: this.inline,
        location: this.currentLocation()
      });
      this.store(zdArticles.key,data);
    },

    txResourceDone: function(data, textStatus) {
      var msg = messages.add('Transifex Resource Retrieved with status:'+textStatus,this.store(messages.key));
      this.store(messages.key,msg);
        data = _.extend(data, {
        inline: this.inline,
        location: this.currentLocation()
      });
        this.store('resource',data);
    },

    txGetResource: function(resource,locale) {
      var msg = messages.add('Get Transifex Resource:'+resource,this.store(messages.key));
      this.store(messages.key,msg);

      this.ajax('txResource', resource, locale);

    },
    txUpsertResource: function(content, slug) {
      var msg = messages.add('Upsert Resource with Slug:'+slug,this.store(messages.key));
      this.store(messages.key,msg);

      var project = this.store(txProject.key);
      var resources = txProject.getResourceArray(project);
      if (util.isStringinArray(slug,resources)){
      
      this.ajax('txUpdate', content, slug);
    } else {
      this.ajax('txInsert', content);
    }
    },

    zdUpsertArticleTranslation: function(resource_data, article_id, zdLocale) {
      var msg = messages.add('Upsert Article with Id:'+article_id+'and locale:'+zdLocale,this.store(messages.key));
      this.store(messages.key,msg);

      var locales = this.store('zd_locales');
      var translationData = util.zdGetTranslationObject(resource_data, zdLocale);
      this.store 
      if (util.isStringinArray(zdLocale,locales)){
      
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
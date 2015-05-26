(function() {
  var myUtil = require('util');
  var myZdArticles = require('zdArticles');
  return txApp(myUtil, myZdArticles);
}());

if (typeof exports !== 'undefined') {
  exports.txApp = txApp();
}

// all dep libraries need to be passed in
// TODO deal with 'this.settings' no idea where 'this' is...brittle - Mjj
function txApp(util, zdArticles) {

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
      zdArticlesInsert: function(data, articleId) {
        return {
          url: '/api/v2/help_center/articles/' + articleId + '/translations.json',
          type: 'POST',
          username: this.settings.zd_username,
          password: this.settings.zd_password,
          data: JSON.stringify(data),
          contentType: 'application/json'
        };
      },
      zdArticlesUpdate: function(data, id, locale) {
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

      'pane.activated': 'showTxAppSettings',
      'txProject.done': 'showTxProject',
      'zdArticles.done': 'showTxProject',
      'txResourceStats.done': 'showResult',
      'txResource.done': 'showResourceResult',
      'zdArticlesInsert': 'showResult'
    },

    init: function() {},

    txSync: function(zdRequest, txRequest) {
      //TODO figure out sync state, then do something interesting
    },

    txUpsert: function(data, callback) {
      //TODO call tfex with some data, update if resource exists, create if not
    },

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
    },
    showResourceResult: function(data, textStatus) {
      data = _.extend(data, {
        textStatus: textStatus,
        inline: this.inline,
        location: this.currentLocation()
      });
      var status = this.store('asyncStatus');
      var translationData = util.zdGetTranslationObject(data, 'fr-be');
      this.ajax('zdArticlesInsert', translationData, status.article_id);

      this.switchTo('projectPage', {
        settings: this.settings, // An object that contains all the setting key-value pairs
        email: this.currentUser().email(),
        installation_id: this.installationId(),
        data: JSON.stringify(translationData)
      });
    },


    showTxProject: function(data) {
      data = _.extend(data, {
        inline: this.inline,
        location: this.currentLocation()
      });
      var allStrings = [];

      var idList = zdArticles.getIdList(data);
      this.ajax('txResource', util.createResourceName(idList[0], 'articles', '-'), 'fr');
      this.store('asyncStatus', {
        index: 0,
        article_id: idList[0],
        resource: util.createResourceName(idList[0], 'articles', '-'),
        status: 'in-progress'
      });

      this.switchTo('projectPage', {
        settings: this.settings, // An object that contains all the setting key-value pairs
        email: this.currentUser().email(),
        installation_id: this.installationId(),
        data: JSON.stringify(idList[0])
      });
    },

    showTxAppSettings: function(event) {
      this.switchTo('mainPage', {
        settings: this.settings, // An object that contains all the setting key-value pairs
        email: this.currentUser().email(),
        uri: util.getDomainFromUrl(event.currentTarget.baseURI), // This gets the matched URL
        installation_id: this.installationId()
      });
      event.preventDefault();

      this.ajax('zdArticles');
    }
  };
}
(function() {
  return txApp(
    require('transifex-api/project'),
    require('transifex-api/resource'),
    require('zendesk-api/article'),
    require('ui/sync-articles')
  );
}());

// This allows the app to be loaded in node
if (typeof exports !== 'undefined') {
  var txp = require('./lib/transifex-api/project.js');
  var txr = require('./lib/transifex-api/resource.js');
  exports.txApp = txApp(txp, txr);
}

function txApp(txProject, txResource, zdArticle, uiSyncArticles) {
  // Note certain deps come from the framework:
  // this.$ = jQuery
  var events = this.$.extend({},
    txProject.events,
    txResource.events,
    zdArticle.events,
    uiSyncArticles.events, {
      'app.activated': 'appActivated'
    }, {
      'app.willDestroy': 'appWillDestroy'
    }
  );
  var requests = this.$.extend({},
    txProject.requests,
    txResource.requests,
    zdArticle.requests
  );
  return this.$.extend({}, {
      events: events,
    }, {
      requests: requests,
    },
    txProject.eventHandlers,
    txProject.actionHandlers,
    txProject.jsonHandlers,
    txResource.eventHandlers,
    txResource.actionHandlers,
    zdArticle.eventHandlers,
    zdArticle.actionHandlers,
    zdArticle.jsonHandlers,
    uiSyncArticles.eventHandlers,
    uiSyncArticles.actionHandlers, {
      appActivated: function() {
        console.log(this);
        console.log('Convert Project Url to API');
        console.log(this.settings.tx_project);
        txProject.url = txProject.convertUrlToApi(this.settings.tx_project);
        console.log('Validate TxProject API URL');
        console.log(txProject.isValidAPIUrl(txProject.url));
        console.log('Adding App Feature Flags');
        console.log(this.settings.features);
        var settingsFeatures = (typeof this.settings.features ===
          'undefined') ? '{}' : this.settings.features;
        console.log(settingsFeatures);
        this.syncStatus = []; // Array of any running async processes
        var features = JSON.parse(settingsFeatures);
        this.featureConfig = function(key) {
          return (features[key]) ? true : false;
        };
        console.log(this.featureConfig('html-tx-resource'));
        console.log('authorize modules');
        txProject.username = txResource.username = this.settings.tx_username;
        txProject.password = txResource.password = this.settings.tx_password;
        // Do Async!!!!
        // Queue async calls and set callback page init
        this.asyncGetTxProject();
        this.asyncGetZdArticles();
        this.switchTo('loading_page');
        this.loadSyncPage = this.uiSyncPageArticlesInit;
      },
      checkAsyncComplete: function() {
        console.log('checkAsyncComplete started');
        if (_.isArray(this.syncStatus)) {
          var count = 0;
          if (_.isEmpty(this.syncStatus)) {
            console.log('all async calls are completed');
            // Danger!!! do not call async functions from this!
            return this.loadSyncPage();
          } else {
            console.log('async calls are not complete');
            console.log(this.syncStatus);
          }
        } else {
          // Something bad happened, reset
          // Show error and prompt user for action
          this.syncStatus = [];
        }
        //TODO display mainpage
      },

      appWillDestroy: function() {
        //TODO cleanup
        console.log('appWillDestroy');
      },

    });

}

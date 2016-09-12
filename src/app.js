(function() {
  return txApp(
    require('transifex-api/project'),
    require('transifex-api/resource'),
    require('zendesk-api/article'),
    require('ui/sync-articles')
  );
}());

var logger = require('logger');
function txApp(txProject, txResource, zdArticle, uiSyncArticles) {
  // Note certain deps come from the framework:
  // this.$ = jQuery
  var events = this.$.extend({
      'app.activated': 'appActivated',
      'app.willDestroy': 'appWillDestroy'
    },
    txProject.events,
    txResource.events,
    zdArticle.events,
    uiSyncArticles.events
  );
  var requests = this.$.extend({},
    txProject.requests,
    txResource.requests,
    zdArticle.requests
  );
  return this.$.extend({
      events: events,
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
        logger.info('Convert Project Url to API:', this.settings.tx_project);
        txProject.url = txProject.convertUrlToApi(this.settings.tx_project);

        logger.info('Validate TxProject API URL:', txProject.url);
        if (!txProject.isValidAPIUrl(txProject.url)) {
          logger.error('API URL is invalid');
        }

        var settingsFeatures = (typeof this.settings.features ===
          'undefined') ? '{}' : this.settings.features;
        logger.info('Adding App Feature Flags:', settingsFeatures);

        this.syncStatus = []; // Array of any running async processes
        var features = JSON.parse(settingsFeatures);
        this.featureConfig = function(key) {
          return (features[key]) ? true : false;
        };

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
        logger.debug('checkAsyncComplete started');
        if (_.isArray(this.syncStatus)) {
          var count = 0;
          if (_.isEmpty(this.syncStatus)) {
            logger.debug('All async calls are completed');
            // Danger!!! do not call async functions from this!
            return this.loadSyncPage();
          } else {
            logger.debug('Async calls are not complete:', this.syncStatus);
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
      },

    });

}

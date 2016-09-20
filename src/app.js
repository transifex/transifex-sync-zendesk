(function() {
  return txApp([
    require('transifex-api/project'),
    require('transifex-api/resource'),
    require('zendesk-api/article'),
    require('zendesk-api/category'),
    require('zendesk-api/section'),
    require('zendesk-api/config'),
    require('ui/sync-articles'),
    require('ui/sync-categories'),
    require('ui/sync-sections'),
    require('ui/notifications'),
  ]);
}());

var logger = require('logger'),
    io = require('io'),
    txutils = require('txUtil');

function txApp(modules) {

  // App was activated
  function appActivated() {
    //set settings to be accessible from everywhere
    io.setSettings(this.settings);
    this.store(
      'page_title',
      txutils.extractOrgFromUrl(this.settings.tx_project).project_slug || 'Zendesk'
    );

    //parse features
    if (this.settings.features) {
      try {
        io.setFeatures(JSON.parse(this.settings.features));
        logger.info('Adding features:', this.settings.features);
      }
      catch(err) {
        logger.error('Could not parse features', this.settings.features);
      }
    }

    //call optional initialize on each module
    _.each(modules, function(mod) {
      if (mod.initialize) mod.initialize();
    }, this);

    // Do Async!!!!
    // Queue async calls and set callback page init
    this.uiArticlesTab();
  }

  // Check for completion of asynchronous operation
  function checkAsyncComplete() {
    if (!io.syncLength()) {
      // Danger!!! do not call async functions from this!
      return this.loadSyncPage();
    }
  }

  // App destroyed event
  function appWillDestroy() {
    //TODO cleanup
  }

  // Note certain deps come from the framework:
  // this.$ = jQuery
  var events = {
      'app.activated': 'appActivated',
      'app.willDestroy': 'appWillDestroy'
    },
    requests = {},
    app = {};

  //load modules
  _.each(modules, function(mod) {
    if (mod.events) {
      events = _.extend(events, mod.events);
    }
    if (mod.requests) {
      requests = _.extend(requests, mod.requests);
    }
    if (mod.eventHandlers) {
      app = _.extend(app, mod.eventHandlers);
    }
    if (mod.actionHandlers) {
      app = _.extend(app, mod.actionHandlers);
    }
    if (mod.jsonHandlers) {
      app = _.extend(app, mod.jsonHandlers);
    }
  }, this);

  return _.extend(app, {
    events: events,
    requests: requests,
    appActivated: appActivated,
    appWillDestroy: appWillDestroy,
    checkAsyncComplete: checkAsyncComplete,
  });
}

/*
// Fixture for error states
(function(open) {
  var fails = [
    '/api/v2/help_center/articles/206631717/translations/zh-cn.json',
    '/api/v2/help_center/articles/206631717/translations/es.json',
    '/api/v2/help_center/articles/227112808/translations/es.json'
  ];

  XMLHttpRequest.prototype.open = function(method, url, async, user, pass) {
    if (_.contains(fails, url)) url = 'derp';
    // Do some magic
    open.call(this, method, url, async, user, pass);
  };
})(XMLHttpRequest.prototype.open);
*/

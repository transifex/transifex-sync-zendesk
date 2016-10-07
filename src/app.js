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
    this.uiLoadConf();
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
  for (var i=0; i < modules.length; i++) {
    var mod = modules[i];
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
  }

  return _.extend(app, {
    events: events,
    requests: requests,
    appActivated: appActivated,
    appWillDestroy: appWillDestroy,
    checkAsyncComplete: checkAsyncComplete,
  });
}

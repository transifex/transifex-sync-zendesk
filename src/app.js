(function() {
  return txApp([
    require('transifex-api/project'),
    require('transifex-api/resource'),
    require('zendesk-api/article'),
    require('zendesk-api/category'),
    require('zendesk-api/section'),
    require('zendesk-api/dynamic-content'),
    require('zendesk-api/config'),
    require('zendesk-api/pagination'),
    require('ui/sync-articles'),
    require('ui/sync-categories'),
    require('ui/sync-sections'),
    require('ui/sync-dynamic-content'),
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
    this.settings.basic_auth = 'Basic ' + btoa(this.currentUser().email() + '/token:' + this.settings.zd_api_key);
    io.setSettings(this.settings);

    var ex = txutils.extractOrgFromUrl(this.settings.tx_project);
    this.store('page_title', ex.project_slug || 'Zendesk');
    this.organization = ex.organization_slug;
    this.tx = ex.tx;
    this.selected_brand = {
      subdomain: ex.project_slug
    }

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
    if (mod.helpers) {
      app = _.extend(app, mod.helpers);
    }
  }
  app.base_url = '/api/v2/help_center/';

  app =  _.extend(app, {
    events: events,
    requests: requests,
    appActivated: appActivated,
    appWillDestroy: appWillDestroy,
    checkAsyncComplete: checkAsyncComplete,
  });
  return app;

}

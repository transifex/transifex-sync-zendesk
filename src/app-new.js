(function() {
  var txp = require('./lib/transifex-api/project.js');
  var txr = require('./lib/transifex-api/resource.js');
  return txApp(txp, txr);
}());

// This allows the app to be loaded in node
if (typeof exports !== 'undefined') {
  var txp = require('./lib/transifex-api/project.js');
  var txr = require('./lib/transifex-api/resource.js');
  exports.txApp = txApp(txp, txr);
}

function txApp(txProject, txResource) {
  // Note certain deps come from the framework:
  // this.$ = jQuery

  var requests = $.extend({}, txProject.requests, txResource.requests);
  var events = $.extend({}, txProject.events, txResource.events);
  return $.extend({}, {
    requests: txProject.requests,
  }, {
    events: txProject.events,
  },
    txProject.eventHandlers,
    txProject.actionHandlers
  );
}

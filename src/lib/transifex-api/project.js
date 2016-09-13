/**
 * The Transifex project API gets project data
 * @module transifex-api/project
 */

var logger = require('../logger'),
    txutils = require('../txUtil');

var project = module.exports = {
  // selfies
  name: 'zendesk-test',
  key: 'tx_project',
  url: 'http://www.transifex.com/api/2/project/testproject/',
  headers: {
    'source-zendesk': 'v1.2.3'
  },
  username: 'testuser',
  password: 'testpass',
  timeout: 6000,
  events: {
    'txProject.done': 'txProjectDone',
    'txProject.fail': 'txProjectSyncError'
  },
  requests: {
    txProject: function(typeString, pageString) {
      logger.debug('txProject ajax request:', typeString + '||' + pageString);
      return {
        url: project.url + '?details',
        headers: project.headers,
        type: 'GET',
        beforeSend: function(jqxhr, settings) {
          jqxhr.page = pageString;
          jqxhr.type = typeString;
        },
        dataType: 'json',
        username: project.username,
        password: project.password,
        timeout: 2000,
        secure: false
      };
    },
  },
  eventHandlers: {
    txProjectDone: function(data, textStatus, jqXHR) {
      logger.info('Transifex Project Retrieved with status:', textStatus);
      this.store(project.key, data);
      this.syncStatus = _.without(this.syncStatus, project.key);
      this.checkAsyncComplete();
    },
    txProjectSyncError: function(jqXHR, textStatus) {
      logger.info('Transifex Project Retrieved with status:', textStatus);
      //this.uiErrorPageInit();
      this.syncStatus = _.without(this.syncStatus, project.key);
      this.checkAsyncComplete();
      if (jqXHR.status === 401) {
        logger.error('txProjectSyncError:', 'Login error');
        //this.updateMessage("txLogin", "error");
      }
    },
  },
  actionHandlers: {
    asyncGetTxProject: function(type, page) {
      logger.debug('function: [asyncGetTxProject] params: [type]' + type + '|| [page]' + page);
      this.syncStatus.push(project.key);
      var that = this;
      setTimeout(
        function() {
          that.ajax('txProject', type, page);
        }, project.timeout);
    },
  },
  jsonHandlers: {
    getResourceArray: function(p) {
      var result = [];
      var r = p.resources;
      if (_.isArray(r)) {
        _.each(r, function(i) {
          result.push(i.slug);
        });
      }
      return result;
    },
    getSourceLocale: function(p) {
      return p.source_language_code;
    },
    getLocales: function(p) {
      return p.teams;
    }
  }
};

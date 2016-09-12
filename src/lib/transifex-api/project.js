/**
 * The Transifex project API gets project data
 * @module transifex-api/project
 */

var logger = require('../logger');

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
  TX_PROJECT_API_URL_REPLACE: "http://www.transifex.com/api/2/project/[PROJECT_SLUG]/",
  TX_PROJECT_API_URL_PATTERN: /(http:\/\/www.transifex.com\/api\/2\/project\/(.*)\/)/,
  TX_PROJECT_URL_PATTERN: /https:\/\/www.transifex.com\/(.*)\/(.*)\//,
  convertUrlToApi: function(u) {
    if (project.isValidUrl(u)) {
      var m = project.TX_PROJECT_URL_PATTERN.exec(u);
      var p = "";
      if (m !== null && m.length > 0) {
        p = m[2]; //TODO make this more explicit that we are mapping the url path
      }
      var r = project.TX_PROJECT_API_URL_REPLACE.replace("[PROJECT_SLUG]",
        p);
      if (project.isValidAPIUrl(r)) {
        return r;
      }
    }
    return false;
  },
  isValidAPIUrl: function(u) {
    var r = project.TX_PROJECT_API_URL_PATTERN.test(u);
    return r;

  },
  isValidUrl: function(u) {
    var r = this.TX_PROJECT_URL_PATTERN.test(u);
    return r;

  },

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

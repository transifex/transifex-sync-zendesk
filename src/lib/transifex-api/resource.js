/**
 * The Transifex resource API gets resource file data
 * from an existing project.
 * @module transifex-api/resource
 */

var txProject = require('./project'),
    syncUtil = require('../syncUtil'),
    io = require('../io'),
    logger = require('../logger');

var resource = module.exports = {
  // selfies
  key: 'tx_resource',
  url: 'https://www.transifex.com/api/2/project/zendesk-test/resource/',
  inserturl: 'https://www.transifex.com/api/2/project/zendesk-test/resources/',
  headers: {
    'X-Source-Zendesk': 'v2.0.0'
  },
  username: 'testuser',
  password: 'testpass',
  timeout: 6000,
  events: {
    'txResourceStats.done': 'txResourceStatsDone',
    'txResourceStats.fail': 'txResourceStatsSyncError',
    'txResource.done': 'txResourceDone',
    'txResource.fail': 'txResourceSyncError',
    'txInsertResource.done': 'txInsertResourceDone',
    'txInsertResource.fail': 'txResourceSyncError',
    'txUpdateResource.done': 'txUpdateResourceDone',
    'txUpdateResource.fail': 'txResourceSyncError',
  },
  initialize: function() {
    var settings = io.getSettings();
    resource.username = settings.tx_username;
    resource.password = settings.tx_password;
  },
  requests: {
    txResourceStats: function(resourceName) {
      logger.debug('txResourceStats ajax request:', resourceName);
      return {
        url: resource.url + resourceName + '/stats/',
        type: 'GET',
        headers: resource.headers,
        beforeSend: function(jqxhr, settings) {
          jqxhr.resourceName = resourceName;
        },
        xhrFields: {
          withCredentials: true
        },
        dataType: 'json',
        username: resource.username,
        password: resource.password,
        timeout: resource.timeout,
        cors: true,
        secure: false
      };
    },
    txResource: function(resourceName, languageCode) {
      logger.debug('txResource ajax request:', resourceName + '||' + languageCode);
      return {
        url: resource.url + resourceName + '/translation/' + languageCode +
          '/',
        type: 'GET',
        headers: resource.headers,
        beforeSend: function(jqxhr, settings) {
          jqxhr.resourceName = resourceName;
          jqxhr.languageCode = languageCode;
        },
        xhrFields: {
          withCredentials: true
        },
        dataType: 'json',
        username: resource.username,
        password: resource.password,
        timeout: resource.timeout,
        cors: true,
        secure: false
      };
    },
    txInsertResource: function(data, resourceName) {
      logger.debug('txInsertResource ajax request:', data + '||' + data.i18n_type);
      return {
        url: resource.inserturl,
        type: 'POST',
        headers: resource.headers,
        beforeSend: function(jqxhr, settings) {
          jqxhr.resourceName = resourceName;
          jqxhr.type = data.i18n_type;
        },
        xhrFields: {
          withCredentials: true
        },
        username: resource.username,
        password: resource.password,
        data: JSON.stringify(data),
        contentType: 'application/json',
        timeout: resource.timeout,
        cors: true,
        secure: false
      };
    },
    txUpdateResource: function(data, resourceName) {
      logger.debug('txUpdateResource ajax request:', data + '||' + resourceName + '||' + data.i18n_type);
      return {
        url: resource.url + resourceName + '/content',
        type: 'PUT',
        headers: resource.headers,
        beforeSend: function(jqxhr, settings) {
          jqxhr.resourceName = resourceName;
          jqxhr.type = data.i18n_type;
        },
        xhrFields: {
          withCredentials: true
        },
        username: resource.username,
        password: resource.password,
        data: JSON.stringify(data),
        cache: false,
        contentType: 'application/json',
        timeout: resource.timeout,
        cors: true,
        secure: false
      };
    },
  },
  eventHandlers: {
    txResourceStatsDone: function(data, textStatus, jqXHR) {
      logger.info('Transifex Resource Stats retrieved with status:', textStatus);
      this.store(resource.key + jqXHR.resourceName, data);
      io.popSync(resource.key + jqXHR.resourceName);
      this.checkAsyncComplete();
    },
    txResourceDone: function(data, textStatus, jqXHR) {
      logger.info('Transifex Resource retrieved with status:', textStatus);
      this.store(resource.key + jqXHR.resourceName + jqXHR.languageCode,
        data);
      io.popSync(resource.key + jqXHR.resourceName + jqXHR.languageCode);
      this.checkAsyncComplete();
    },
    txInsertResourceDone: function(data, textStatus, jqXHR) {
      logger.info('Transifex Resource inserted with status:', textStatus);
      io.popSync(resource.key + jqXHR.resourceName + 'upsert');
      this.checkAsyncComplete();
    },
    txUpdateResourceDone: function(data, textStatus, jqXHR) {
      logger.info('Transifex Resource updated with status:', textStatus);
      io.popSync(resource.key + jqXHR.resourceName + 'upsert');
      this.checkAsyncComplete();
    },
    txResourceStatsSyncError: function(jqXHR, textStatus) {
      logger.info('Transifex Resource Stats Retrieved with status:', textStatus);
      io.popSync(resource.key + jqXHR.resourceName);
      // Save error status instead of resource
      this.store(resource.key + jqXHR.resourceName, jqXHR.status);
      this.checkAsyncComplete();
    },
    txResourceSyncError: function(jqXHR, textStatus) {
      logger.info('Transifex Resource Retrieved with status:', textStatus);
      io.popSync(resource.key + jqXHR.resourceName + jqXHR.languageCode);
      this.store(resource.key + jqXHR.resourceName, jqXHR.status);
      this.checkAsyncComplete();
    },
  },
  actionHandlers: {
    displayResource: function(resourceName) {
      this.asyncGetTxResourceStats(resourceName);
      var pageData = this.store(resource.key + resourceName);
      pageData = [pageData];
      this.switchTo('sync_resource_status', {
        dataset: pageData,
      });
    },
    completedLanguages: function(stats) {
      var arr = [];
      _.each(stats, function(value, key) {
        var match = (value['completed'] === "100%");
        if (match) {
          arr.push(key);
        }
      });

      return arr;
    },
    displayResourceLanguage: function(resourceName, languageCode) {
      this.asyncGetTxResource(resourceName, languageCode);
      var pageData = this.store(resource.key + resourceName + languageCode);
      pageData = _.extend(pageData, {
        'name': resourceName,
        'language_code': languageCode
      });
      pageData = [pageData];
      this.switchTo('sync_resource_language_status', {
        dataset: pageData,
      });
    },

    txUpsertResource: function(content, slug) {
      logger.info('txUpsertResource:', content + '||' + slug);
      var project = this.store(txProject.key);
      var resources = this.getResourceArray(project);
      //check list of resources in the project
      if (syncUtil.isStringinArray(slug, resources)) {
        this.ajax('txUpdateResource', content, slug);
      } else {
        this.ajax('txInsertResource', content, slug);
      }
    },
    asyncGetTxResourceStats: function(name) {
      logger.info('asyncGetTxResourceStats:', name);
      io.pushSync(resource.key + name);
      var that = this;
      setTimeout(
        function() {
          that.ajax('txResourceStats', name);
        }, resource.timeout);
    },
    asyncGetTxResource: function(name, code) {
      logger.info('asyncGetTxResource:', name + code);
      io.pushSync(resource.key + name + code);
      var that = this;
      setTimeout(
        function() {
          that.ajax('txResource', name, code);
        }, resource.timeout);
    },
    asyncTxUpsertResource: function(data, name) {
      logger.info('asyncTxUpdateResource:', name);
      io.pushSync(resource.key + name + 'upsert');
      var that = this;
      setTimeout(
        function() {
          that.txUpsertResource(data, name);
        }, resource.timeout);
    },
  },
};

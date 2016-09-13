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
  url: 'http://www.transifex.com/api/2/project/zendesk-test/resource/',
  inserturl: 'http://www.transifex.com/api/2/project/zendesk-test/resources/',
  headers: {
    'source-zendesk': 'v1.2.3'
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
        dataType: 'json',
        username: resource.username,
        password: resource.password,
        timeout: resource.timeout,
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
        dataType: 'json',
        username: resource.username,
        password: resource.password,
        timeout: resource.timeout,
        secure: false
      };
    },
    txInsertResourceJsonData: function(data, resourceName, typeString) {
      logger.debug('txInsertResource ajax request:', data + '||' + typeString);
      return {
        url: resource.inserturl,
        type: 'POST',
        headers: resource.headers,
        beforeSend: function(jqxhr, settings) {
          jqxhr.resourceName = resourceName;
          jqxhr.type = typeString;
        },
        username: resource.username,
        password: resource.password,
        data: JSON.stringify(data),
        contentType: 'application/json',
        timeout: resource.timeout,
        secure: false
      };
    },
    txInsertResourceFormData: function(data, resourceName, typeString) {
      logger.debug('txInsertResource ajax request:', data + '||' + typeString);
      return {
        url: resource.inserturl,
        type: 'POST',
        headers: resource.headers,
        beforeSend: function(jqxhr, settings) {
          jqxhr.resourceName = resourceName;
          jqxhr.type = typeString;
        },
        username: resource.username,
        password: resource.password,
        data: new FormData(data),
        cache: false,
        contentType: false,
        processData: false,
        timeout: resource.timeout,
        secure: false
      };
    },
    txUpdateResourceFormData: function(data, resourceName, typeString) {
      logger.debug('txUpdateResource ajax request:', data + '||' + resourceName + '||' + typeString);
      return {
        url: resource.url + resourceName + '/content',
        type: 'PUT',
        headers: resource.headers,
        beforeSend: function(jqxhr, settings) {
          jqxhr.resourceName = resourceName;
          jqxhr.type = typeString;
        },
        username: resource.username,
        password: resource.password,
        data: new FormData(data),
        cache: false,
        contentType: false,
        processData: false,
        timeout: resource.timeout,
        secure: false
      };
    },
    txUpdateResourceJsonData: function(data, resourceName, typeString) {
      logger.debug('txUpdateResource ajax request:', data + '||' + resourceName + '||' + typeString);
      return {
        url: resource.url + resourceName + '/content',
        type: 'PUT',
        headers: resource.headers,
        beforeSend: function(jqxhr, settings) {
          jqxhr.resourceName = resourceName;
          jqxhr.type = typeString;
        },
        username: resource.username,
        password: resource.password,
        data: JSON.stringify(data),
        contentType: 'application/json',
        timeout: resource.timeout,
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
        if (io.hasFeature('html-tx-resource')) {
          this.ajax('txUpdateResourceFormData', content, slug);
        } else {
          this.ajax('txUpdateResourceJsonData', content, slug);
        }
      } else {
        if (io.hasFeature('html-tx-resource')) {
          this.ajax('txInsertResourceFormData', content, slug);
        } else {
          this.ajax('txInsertResourceJsonData', content, slug);
        }
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
          //that.ajax('txUpdateResource', data, name);
        }, resource.timeout);
    },
  },
};

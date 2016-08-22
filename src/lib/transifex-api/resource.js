/**
 * The Transifex resource API gets resource file data
 * from an existing project.
 * @module transifex-api/resource
 */

var txProject = require('./project');
var syncUtil = require('../syncUtil');

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
  logging: true,
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
  requests: {
    txResourceStats: function(resourceName) {
      if (resource.logging) {
        console.log('txResourceStats ajax request:' + resourceName);
      }
      return {
        url: resource.url + resourceName + '/stats/',
        type: 'GET',
        headers: resource.url,
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
      if (resource.logging) {
        console.log('txResource ajax request:' + resourceName + '||' +
          languageCode);
      }
      return {
        url: resource.url + resourceName + '/translation/' + languageCode +
          '/',
        type: 'GET',
        headers: resource.url,
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
    txInsertResource: function(data, resourceName, typeString) {
      if (resource.logging) {
        console.log('txInsertResource ajax request:' + data + '||' +
          typeString);
      }
      return {
        url: resource.inserturl,
        type: 'POST',
        headers: resource.url,
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
    txUpdateResource: function(data, resourceName, typeString) {
      if (resource.logging) {
        console.log('txUpdateResource ajax request:' + data + '||' +
          resourceName + '||' + typeString);
      }
      return {
        url: resource.url + resourceName + '/content',
        type: 'PUT',
        headers: resource.url,
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
      if (resource.logging) {
        console.log('Transifex Resource Stats retrieved with status:' +
          textStatus);
      }
      this.store(resource.key + jqXHR.resourceName, data);
      this.syncStatus = _.without(this.syncStatus, resource.key + jqXHR.resourceName);
      this.checkAsyncComplete();
    },
    txResourceDone: function(data, textStatus, jqXHR) {
      if (resource.logging) {
        console.log('Transifex Resource retrieved with status:' +
          textStatus);
      }
      this.store(resource.key + jqXHR.resourceName + jqXHR.languageCode,
        data);
      this.syncStatus = _.without(this.syncStatus, resource.key + jqXHR.resourceName +
        jqXHR.languageCode);
      this.checkAsyncComplete();
    },
    txInsertResourceDone: function(data, textStatus, jqXHR) {
      if (resource.logging) {
        console.log('Transifex Resource inserted with status:' + textStatus);
      }
      console.log(resource.key + jqXHR.resourceName + 'upsert');
      this.syncStatus = _.without(this.syncStatus, resource.key + jqXHR.resourceName +
        'upsert');
      this.checkAsyncComplete();
    },
    txUpdateResourceDone: function(data, textStatus, jqXHR) {
      if (resource.logging) {
        console.log('Transifex Resource updated with status:' + textStatus);
      }
      console.log(resource.key + jqXHR.resourceName + 'upsert');
      this.syncStatus = _.without(this.syncStatus, resource.key + jqXHR.resourceName +
        'upsert');
      this.checkAsyncComplete();
    },
    txResourceStatsSyncError: function(jqXHR, textStatus) {
      if (resource.logging) {
        console.log('Transifex Resource Stats Retrieved with status:' +
          textStatus);
      }
      this.syncStatus = _.without(this.syncStatus, resource.key + jqXHR.resourceName);
      // Save error status instead of resource
      this.store(resource.key + jqXHR.resourceName, jqXHR.status);
      this.checkAsyncComplete();
    },
    txResourceSyncError: function(jqXHR, textStatus) {
      if (resource.logging) {
        console.log('Transifex Resource Retrieved with status:' +
          textStatus);
      }
      this.syncStatus = _.without(this.syncStatus, resource.key + jqXHR.resourceName +
        jqXHR.languageCode);
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
      if (resource.logging) {
        console.log('txUpsertResource' + content + '||' + slug);
      }

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
      if (resource.logging) {
        console.log('asyncGetTxResourceStats:' + name);
      }
      this.syncStatus.push(resource.key + name);
      var that = this;
      setTimeout(
        function() {
          that.ajax('txResourceStats', name);
        }, resource.timeout);
    },
    asyncGetTxResource: function(name, code) {
      if (resource.logging) {
        console.log('asyncGetTxResource:' + name + code);
      }
      this.syncStatus.push(resource.key + name + code);
      var that = this;
      setTimeout(
        function() {
          that.ajax('txResource', name, code);
        }, resource.timeout);
    },
    asyncTxUpsertResource: function(data, name) {
      if (resource.logging) {
        console.log('asyncTxUpdateResource:' + name);
      }
      this.syncStatus.push(resource.key + name + 'upsert');
      var that = this;
      setTimeout(
        function() {
          that.txUpsertResource(data, name);
          //that.ajax('txUpdateResource', data, name);
        }, resource.timeout);
    },
  },
};

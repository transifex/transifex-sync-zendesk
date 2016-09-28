/**
 * The Transifex resource API gets resource file data
 * from an existing project.
 * @module transifex-api/resource
 */

var txProject = require('./project'),
    syncUtil = require('../syncUtil'),
    io = require('../io'),
    logger = require('../logger'),
    txutils = require('../txUtil');

var resource = module.exports = {
  // selfies
  key: 'tx_resource',
  url: '',
  inserturl: '',
  headers: {
    'X-Source-Zendesk': 'v2.0.0'
  },
  username: '',
  password: '',
  events: {
    'txResourceStats.done': 'txResourceStatsDone',
    'txResourceStats.fail': 'txResourceStatsError',

    'txResource.done': 'txResourceDone',
    'txResource.fail': 'txResourceError',

    'txInsertResource.done': 'txInsertResourceDone',
    'txInsertResource.fail': 'txUpsertResourceError',

    'txUpdateResource.done': 'txUpdateResourceDone',
    'txUpdateResource.fail': 'txUpsertResourceError',
  },
  initialize: function() {
    var settings = io.getSettings();
    resource.username = settings.tx_username;
    resource.password = settings.tx_password;
    resource.url = txutils.convertUrlToApi(settings.tx_project) + 'resource/';
    resource.inserturl = txutils.convertUrlToApi(settings.tx_project) + 'resources/';
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
        username: resource.username,
        password: resource.password,
        data: JSON.stringify(data),
        contentType: 'application/json',
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
        username: resource.username,
        password: resource.password,
        data: JSON.stringify(data),
        cache: false,
        contentType: 'application/json',
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
    txResourceStatsError: function(jqXHR, textStatus) {
      logger.info('Transifex Resource Stats Retrieved with status:', textStatus);
      var retries = io.getRetries('txResourceStats' + jqXHR.resourceName);
      if (jqXHR.status == 401 && retries < 2) {
        this.ajax('txResourceStats', jqXHR.resourceName);
        io.setRetries('txResourceStats' + jqXHR.resourceName, retries + 1);
      } else {
        io.popSync(resource.key + jqXHR.resourceName);
        // Save error status instead of resource
        this.store(resource.key + jqXHR.resourceName, jqXHR.status);
        this.checkAsyncComplete();
      }
    },

    txResourceDone: function(data, textStatus, jqXHR) {
      logger.info('Transifex Resource retrieved with status:', textStatus);
      this.store(resource.key + jqXHR.resourceName + jqXHR.languageCode,
        data);
      io.popSync(resource.key + jqXHR.resourceName + jqXHR.languageCode);
      this.checkAsyncComplete();
    },
    txResourceError: function(jqXHR, textStatus) {
      logger.info('Transifex Resource Retrieved with status:', textStatus);
      var retries = io.getRetries('txResource' + jqXHR.resourceName);
      if (jqXHR.status == 401 && retries < 2) {
        this.ajax('txResource', jqXHR.resourceName);
        io.setRetries('txResource' + jqXHR.resourceName, retries + 1);
      } else {
        io.popSync(resource.key + jqXHR.resourceName + jqXHR.languageCode);
        this.store(resource.key + jqXHR.resourceName, jqXHR.status);
        io.opSet(jqXHR.resourceName, 'fail');
        this.checkAsyncComplete();
      }
    },

    txInsertResourceDone: function(data, textStatus, jqXHR) {
      logger.info('Transifex Resource inserted with status:', textStatus);
      io.popSync(resource.key + jqXHR.resourceName + 'upsert');
      io.opSet(jqXHR.resourceName, 'success');
      this.checkAsyncComplete();
    },
    txUpdateResourceDone: function(data, textStatus, jqXHR) {
      logger.info('Transifex Resource updated with status:', textStatus);
      io.popSync(resource.key + jqXHR.resourceName + 'upsert');
      io.opSet(jqXHR.resourceName, 'success');
      this.checkAsyncComplete();
    },
    txUpsertResourceError: function(jqXHR, textStatus) {
      logger.info('Transifex Resource Retrieved with status:', textStatus);
      io.popSync(resource.key + jqXHR.resourceName + 'upsert');
      this.store(resource.key + jqXHR.resourceName, jqXHR.status);
      io.opSet(jqXHR.resourceName, 'fail');
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
      var arr = [],
          zd_enabled = this.store('zd_project_locales');
      _.each(stats, function(value, key) {
        var match = (value['completed'] === "100%");
        var zd_key = syncUtil.txLocaletoZd(key);
        if (match && zd_enabled.indexOf(zd_key) != -1) {
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
      io.opSet(slug, 'processing');
      if (syncUtil.isStringinArray(slug, resources)) {
        this.ajax('txUpdateResource', content, slug);
      } else {
        this.ajax('txInsertResource', content, slug);
      }
    },
    asyncGetTxResourceStats: function(name) {
      logger.info('asyncGetTxResourceStats:', name);
      io.pushSync(resource.key + name);
      io.setRetries('txResourceStats' + name, 0);
      this.ajax('txResourceStats', name);
    },
    asyncGetTxResource: function(name, code) {
      logger.info('asyncGetTxResource:', name + code);
      io.pushSync(resource.key + name + code);
      this.ajax('txResource', name, code);
    },
    asyncTxUpsertResource: function(data, name) {
      logger.info('asyncTxUpdateResource:', name);
      io.pushSync(resource.key + name + 'upsert');
      io.setRetries('txResource' + name, 0);
      this.txUpsertResource(data, name);
    },
  },
};

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
    'X-Source-Zendesk': 'ZendeskApp/2.1.0'
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
    resource.url = txProject.url + 'resource/';
    resource.inserturl = txProject.url + 'resources/';
    resource.headers['Authorization'] = 'Basic ' + btoa(resource.username + ':' + resource.password);
  },
  requests: {
    txResourceStats: function(resourceName) {
      logger.debug('txResourceStats ajax request:', resourceName);
      return {
        url: `${this.tx}/api/2/project/${this.selected_brand.subdomain}/resource/${resourceName}/stats/`,
        type: 'GET',
        headers: resource.headers,
        beforeSend: function(jqxhr, settings) {
          jqxhr.resourceName = resourceName;
        },
        dataType: 'json',
        cors: true
      };
    },
    txResource: function(resourceName, languageCode) {
      logger.debug('txResource ajax request:', resourceName + '||' + languageCode);
      return {
        url: `${this.tx}/api/2/project/${this.selected_brand.subdomain}/resource/${resourceName}/${languageCode}/`,
        type: 'GET',
        headers: resource.headers,
        beforeSend: function(jqxhr, settings) {
          jqxhr.resourceName = resourceName;
          jqxhr.languageCode = languageCode;
        },
        dataType: 'json',
        cors: true
      };
    },
    txInsertResource: function(data, resourceName) {
      logger.debug('txInsertResource ajax request:', data + '||' + data.i18n_type);
      return {
        url: `${this.tx}/api/2/project/${this.selected_brand.subdomain}/resources/`,
        type: 'POST',
        headers: resource.headers,
        beforeSend: function(jqxhr, settings) {
          jqxhr.resourceName = resourceName;
          jqxhr.type = data.i18n_type;
        },
        data: JSON.stringify(data),
        contentType: 'application/json',
        cors: true
      };
    },
    txUpdateResource: function(data, resourceName) {
      logger.debug('txUpdateResource ajax request:', data + '||' + resourceName + '||' + data.i18n_type);
      return {
        url: `${this.tx}/api/2/project/${this.selected_brand.subdomain}/resource/${resourceName}/content/`,
        type: 'PUT',
        headers: resource.headers,
        beforeSend: function(jqxhr, settings) {
          jqxhr.resourceName = resourceName;
          jqxhr.type = data.i18n_type;
        },
        data: JSON.stringify(data),
        cache: false,
        contentType: 'application/json',
        cors: true
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
      io.pushResource(jqXHR.resourceName);
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
    completedLanguages: function(stats) {
      var arr = [],
          locales = io.getLocales(),
          default_locale = this.store('default_locale');
      _.each(stats, function(value, key) {
        var match = (value['completed'] === "100%");
        var zd_key = syncUtil.txLocaletoZd(key, locales);
        if (match && zd_key && zd_key !== default_locale) {
          arr.push(key);
        }
      });

      return arr;
    },
    txUpsertResource: function(content, slug) {
      logger.info('txUpsertResource:', content + '||' + slug);
      var project = this.store(txProject.key);
      var resources = io.getResourceArray();
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
  helpers: {
    resourceCompletedPercentage: function(resource_stats) {
      var sum = 0, locale_count = 0, zd_locale,
          locales = io.getLocales(),
          default_locale = this.store('default_locale');
      _.each(resource_stats, function(stat, code) {
        zd_locale = syncUtil.txLocaletoZd(code, locales);
        if ( zd_locale !== null && zd_locale !== default_locale ) {
          sum += parseInt(stat.completed.split('%')[0]);
          locale_count += 1;
        }
      });
      return Math.ceil(sum / locale_count);
    },
  },
};

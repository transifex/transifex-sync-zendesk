/**
 * The Transifex resource API gets resource file data
 * from an existing project.
 * @module transifex-api/resource
 */

var txProject = require('./project'),
    syncUtil = require('../syncUtil'),
    io = require('../io'),
    logger = require('../logger'),
    txutils = require('../txUtil'),
    common = require('../common');

const findIndex = require('lodash.findindex');

var resource = module.exports = {
  // selfies
  key: 'tx_resource',
  url: '',
  inserturl: '',
  headers: {
    'X-Source-Zendesk': 'ZendeskApp/3.0.4'
  },
  username: '',
  password: '',
  // A list that keeps a batch of resources to be uploaded
  batchArray: [],
  // Category to be used when uploading multiple resources
  category: '',
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
        url: this.tx + '/api/2/project/' + this.selected_brand.tx_project + '/resource/' + resourceName + '/stats/',
        type: 'GET',
        headers: resource.headers,
        dataType: 'json',
        cors: true
      };
    },
    txResource: function(resourceName, languageCode, entryid) {
      logger.debug('txResource ajax request:', resourceName + '||' + languageCode);
      return {
        url: this.tx + '/api/2/project/' + this.selected_brand.tx_project + '/resource/' + resourceName + '/translation/' + languageCode + '/',
        type: 'GET',
        headers: resource.headers,
        dataType: 'json',
        cors: true
      };
    },
    txInsertResource: function(data, resourceName) {
      logger.debug('txInsertResource ajax request:', data + '||' + data.i18n_type);
      return {
        url: this.tx + '/api/2/project/' + this.selected_brand.tx_project + '/resources/',
        type: 'POST',
        headers: resource.headers,
        data: JSON.stringify(data),
        contentType: 'application/json',
        cors: true
      };
    },
    txUpdateResource: function(data, resourceName) {
      logger.debug('txUpdateResource ajax request:', data + '||' + resourceName + '||' + data.i18n_type);
      return {
        url: this.tx + '/api/2/project/' + this.selected_brand.tx_project + '/resource/' + resourceName + '/content/',
        type: 'PUT',
        headers: resource.headers,
        data: JSON.stringify(data),
        cache: false,
        contentType: 'application/json',
        cors: true
      };
    },
    txRenameResource: function(data, resourceSlug) {
      logger.debug('txRenameResource ajax request:', data + '||' + resourceSlug);
      return {
        url: this.tx + '/api/2/project/' + this.selected_brand.tx_project + '/resource/' + resourceSlug + '/',
        type: 'PUT',
        headers: resource.headers,
        data: JSON.stringify(data),
        cache: false,
        contentType: 'application/json',
        cors: true
      };
    },
  },
  eventHandlers: {
    txResourceStatsDone: function(data, resourceName) {
      logger.info('Transifex Resource Stats retrieved with status:', 'OK');
      this.store(resource.key + resourceName, data);
      io.popSync(resource.key + resourceName);
      this.checkAsyncComplete();
    },
    txResourceStatsError: function(jqXHR, name) {
      logger.info('Transifex Resource Stats Retrieved with status:', jqXHR.statusText);
      var retries = io.getRetries('txResourceStats' + name);
      if (jqXHR.status == 401 && retries < 2) {
        this.ajax('txResourceStats', name)
          .done(data => {
            this.txResourceStatsDone(data, name);
          })
          .fail(xhr => {
            this.txResourceStatsError(xhr, name);
          });
        io.setRetries('txResourceStats' + name, retries + 1);
      } else {
        io.popSync(resource.key + name);
        // Save error status instead of resource
        this.store(resource.key + name, jqXHR.status);
        this.checkAsyncComplete();
      }
    },

    txResourceDone: function(data, resourceName, languageCode, entryid) {
      logger.info('Transifex Resource retrieved with status:', 'OK');
      var zd_locales = io.getLocales();
      var zdLocale = syncUtil.txLocaletoZd(languageCode, zd_locales);
      var type = this.resolveResourceType(resourceName);

      this['zdUpsert<T>Translation'.replace('<T>', type)](
        data.content, entryid, zdLocale
      );
      io.popSync(resource.key + resourceName + languageCode);
    },

    txResourceError: function(jqXHR, resourceName, languageCode, entryid) {
      logger.info('Transifex Resource Retrieved with status:', jqXHR.statusText);
      var retries = io.getRetries('txResource' + resourceName);
      if (jqXHR.status == 401 && retries < 2) {
        this.ajax('txResource', resourceName, languageCode, entryid)
          .done(data => {
            this.txResourceDone(data, resourceName, languageCode, entryid);
          })
          .fail(xhr => {
            this.txResourceError(xhr, resourceName, languageCode, entryid);
          });
        io.setRetries('txResource' + resourceName, retries + 1);
      } else {
        io.popSync(resource.key + resourceName + languageCode);
        this.store(resource.key + resourceName, jqXHR.status);
        io.opSet(resourceName, 'fail');
        this.txUpsertResourceNext();
      }
    },

    txInsertResourceDone: function(data, resourceName) {
      logger.info('Transifex Resource inserted with status:', 'OK');
      io.popSync(resource.key + resourceName + 'upsert');

      io.opSet(resourceName, 'success');
      io.pushResource(resourceName);
      this.txUpsertResourceNext();
    },

    txUpdateResourceDone: function(data, resourceName) {
      logger.info('Transifex Resource updated with status:', 'OK');
      io.popSync(resource.key + resourceName + 'upsert');
      io.opSet(resourceName, 'success');
      this.txUpsertResourceNext();
    },

    txUpsertResourceError: function(jqXHR, resourceName) {
      logger.info('Transifex Resource Retrieved with status:', jqXHR.statusText);
      io.popSync(resource.key + resourceName + 'upsert');
      this.store(resource.key + resourceName, jqXHR.status);
      io.opSet(resourceName, 'fail');
      this.txUpsertResourceNext();
    },

    txRenameResourceDone: function(data, resourceSlug) {
      logger.info('Transifex resource renamed with status:', 'OK');
      io.renameDone();
    },

    txRenameResourceError: function(jqXHR, resourceSlug) {
      logger.info('Transifex Resource Retrieved with status:', jqXHR.statusText);
      io.renameFail();
    },
  },
  actionHandlers: {
    completedLanguages: function(stats) {
      var arr = [],
          locales = io.getLocales(),
          default_locale = this.store('default_locale');
      _.each(stats, function(value, key) {
        var match = (value['untranslated_entities'] == 0);
        var zd_key = syncUtil.txLocaletoZd(key, locales);
        if (match && zd_key && zd_key !== default_locale) {
          arr.push(key);
        }
      });

      return arr;
    },
    txUpsertBatchResources: function(getTForTranslationFunction, category, batchArray) {
      /**
       * Upsert multiple resources
       * 
       * @param {function} getTForTranslationFunction Reference to the get<T>ForTranslation function
       * @param {string} category Possible values: 'Resources' | 'Dynamic'
       * @param {list} batchArray An array of resources to be upserted
       */
      resource.getTForTranslationFunction = getTForTranslationFunction
      resource.batchArray = batchArray;
      resource.category = category;
      /*
       * Start upserting resources one at a time. The txUpsertResourceNext function
       * will upsert the first resource, and will call itshef again (itterating to the
       * next one) once its finished (we use ajax's 'done' event to know when a resource 
       * is finished).
       */
      this.txUpsertResourceNext();
    },
    txUpsertResourceNext: function() {
      /**
       * Take the next resource of the batchArray and try to upsert it.
       */
      if (!resource.batchArray.length) {
        /**
         * If the array length is empty, no other resources left to be upserted, so at
         * this point we can notify the frontend.
         */
          this.notifyReset();
          this.checkAsyncComplete();
          return;
      }
      this.notifyReset();
      this.notifyInfo('' + resource.batchArray.length + ' resources remaining');
      // Get the next resource to upsert
      let entry = resource.batchArray.shift();
      let txResourceName = entry.resource_name;
      // The getArticlesForTranslation() can be found in factory.js as 
      // get<T>ForTranslation(). In our case, <T> is Articles.
      let resource_request = common.txRequestFormat(
        resource.getTForTranslationFunction(entry), resource.category
      );
      io.pushSync(resource.key + txResourceName + 'upsert');
      this.txUpsertResource(resource_request, txResourceName);
    },
    txUpsertResource: function(content, slug) {
      logger.info('txUpsertResource:', content + '||' + slug);
      // Check list of resources in the Transifex project
      let project = this.store(txProject.key);
      let resources = io.getResourceArray();
      io.opSet(slug, 'processing');
      let resource_index = findIndex(resources, {slug: slug});
      if (resource_index > -1) {
        let new_name = content.name,
            old_name = resources[resource_index]['name'];
        if (new_name != old_name) {
          this.ajax('txRenameResource', {"name": new_name}, slug)
            .done(data => this.txRenameResourceDone(data, slug))
            .fail(xhr => this.txRenameResourceError(xhr, slug));

          // Save the new name to the resources array so we won't try to rename
          // the same resource twice
          resources[resource_index]['name'] = new_name;
          io.setResourceArray(resources);
        }
        this.ajax('txUpdateResource', content, slug)
          .done(data => this.txUpdateResourceDone(data, slug))
          .fail(xhr => this.txUpsertResourceError(xhr, slug));
      } else {
        this.ajax('txInsertResource', content, slug)
          .done(data => this.txInsertResourceDone(data, slug))
          .fail(xhr => this.txUpsertResourceError(xhr, slug));
      }
    },
    asyncGetTxResourceStats: function(name) {
      logger.info('asyncGetTxResourceStats:', name);
      io.pushSync(resource.key + name);
      io.setRetries('txResourceStats' + name, 0);
      this.ajax('txResourceStats', name)
        .done(data => {
          this.txResourceStatsDone(data, name);
        })
        .fail(xhr => {
          this.txResourceStatsError(xhr, name);
        });
    },
    asyncGetTxResource: function(name, code, entryid) {
      logger.info('asyncGetTxResource:', name + code);
      io.pushSync(resource.key + name + code);
      this.ajax('txResource', name, code, entryid)
        .done(data => {
          this.txResourceDone(data, name, code, entryid);
        })
        .fail(xhr => {
          this.txResourceError(xhr, name, code, entryid);
        });
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
    resolveResourceType: function(resourceName) {
      var t = resourceName.split('-')[1];
      return {
        'articles': 'Articles',
        'sections': 'Sections',
        'categories': 'Categories',
        'dynamic': 'DynamicContent'
      }[t];
    }
  },
};

/**
 * The Transifex project API gets project data
 * @module transifex-api/project
 */

var logger = require('../logger'),
    io = require('../io'),
    syncUtil = require('../syncUtil'),
    txutils = require('../txUtil.js'),
    findIndex = require('lodash.findindex');

var project = module.exports = {
  // selfies
  name: 'zendesk-test',
  key: 'tx_project',
  url: '',
  headers: {
    'X-Source-Zendesk': 'ZendeskApp/3.0.7'
  },
  username: '',
  password: '',
  initialize: function() {
    var settings = io.getSettings();
    var url = settings.tx_project;

    logger.info('Convert Project Url to API:', settings.tx_project);
    if (!url.endsWith('/'))
      url = url + '/';
    if (url.endsWith('dashboard/'))
      url = url.replace('dashboard/', '');

    project.url = txutils.convertUrlToApi(url);
    project.dashboard_url = url;

    logger.info('Validate TxProject API URL:', project.url);
    if (!txutils.isValidAPIUrl(project.url)) {
      logger.error('API URL is invalid');
    }

    project.username = settings.tx_username;
    project.password = settings.tx_password;
    project.headers['Authorization'] = 'Basic ' + btoa(project.username + ':' + project.password);
  },
  requests: {
    txProject: function() {
      logger.debug('txProject ajax request');
      return {
        url: this.tx + '/api/2/project/' + this.selected_brand.tx_project,
        data: {
          'details': true
        },
        headers: project.headers,
        type: 'GET',
        cache: false,
        dataType: 'json',
        cors: true
      };
    },
    txProjectExists: function(project_slug) {
      logger.debug('txProjectExists ajax request');
      return {
        url: this.tx + '/api/2/project/' + project_slug,
        headers: project.headers,
        data: {'details': true},
        type: 'GET',
        cache: false,
        dataType: 'json',
        cors: true
      };
    },
    txProjectCreate: function(slug, name, source, targets, brand_id) {
      logger.debug('txProjectCreate ajax request');
      var settings = io.getSettings();
      return {
        url: this.tx + '/api/2/projects',
        headers: project.headers,
        type: 'POST',
        cache: false,
        contentType: 'application/json',
        data: JSON.stringify({
          name: name,
          slug: slug,
          organization: this.organization,
          private: true,
          description: 'Zendesk brand - ' + name,
          source_language_code: source
        }),
        cors: true
      };
    },
    txProjectAddLanguage: function(project_slug, language_code, brand_id) {
      logger.debug('txProjectCreate ajax request');
      var settings = io.getSettings();
      return {
        url: this.tx + '/api/2/project/' + project_slug + '/languages',
        headers: project.headers,
        type: 'POST',
        cache: false,
        contentType: 'application/json',
        data: JSON.stringify({
          language_code: language_code,
          coordinators: [settings.tx_username]
        }),
        cors: true
      };
    },
  },
  eventHandlers: {
    txProjectExistsDone: function(data, slug) {
      this.store('project_exists', true);
      io.popSync('check_exists_' + slug);
      var brand_id = parseInt(slug.split('-').pop());
      var brands = this.store('brands');
      brands[findIndex(brands, { id: brand_id })].exists = true;
      this.store('brands', brands);
      this.checkAsyncComplete();
    },
    txProjectExistsError: function(xhr, slug) {
      this.store('project_exists', false);
      io.popSync('check_exists_' + slug);
      var brand_id = parseInt(slug.split('-').pop());
      var brands = this.store('brands');
      brands[findIndex(brands, { id: brand_id })].exists = false;
      this.store('brands', brands);
      Sentry.captureMessage(`txProjectExistsError: [${xhr.status} ${xhr.statusText}] ${xhr.responseText || xhr.responseJSON}`);
      this.checkAsyncComplete();
    },
    txProjectDone: function(data, status) {
      logger.info('Transifex Project Retrieved with status:', status);
      this.store(project.key, data);
      io.setResourceArray(data.resources);
      io.popSync(project.key);
      this.checkAsyncComplete();
    },
    txProjectSyncError: function(jqXHR, textStatus) {
      logger.info('Transifex Project Retrieved with status:', textStatus);
      io.popSync(project.key);
      if (jqXHR.status === 404) {
        logger.error('txProjectSyncError:', 'Not found');
        io.setPageError('txProject:not_found');
      }
      else if (jqXHR.status === 401 && io.getRetries('txProject') < 1) {
        this.ajax('txProject')
          .done(data => {
            this.txProjectDone(data, 'OK');
          })
          .fail(xhr => {
            this.txProjectSyncError(xhr, 'error');
          });
        io.setRetries('txProject', io.getRetries('txProject') + 1);
      }
      else if (jqXHR.status === 401) {
        logger.error('txProjectSyncError:', 'Login error');
        io.setPageError('txProject:login');
      }
      else if (jqXHR.status === 403) {
        logger.error('txProjectSyncError:', 'subscription permissions');
        io.setPageError('txProject:permission');
      }
      else {
        io.setPageError('txProject');
      }
      Sentry.captureMessage(`txProjectSyncError: [${jqXHR.status} ${jqXHR.statusText}] ${jqXHR.responseText || jqXHR.responseJSON}`);
      this.checkAsyncComplete();
    },
    txProjectCreateDone: function(data, slug, targets, brand_id) {
      io.popSync('create_project_' + slug);
      var that = this;

      // Mark the resource as existing
      let brands = this.store('brands');
      brands[findIndex(brands, { id: brand_id })].exists = true;
      this.store('brands', brands);

      // Inform the user about the newly created resource
      let msg = 'Project ' + slug + ' created';
      this.queueNotification(msg, 'success');

      // Try to create language groups
      let total = targets.length, succeeded = 0, failed = 0;

      let promises = _.map(targets, locale => {
          return that.ajax('txProjectAddLanguage', slug, locale, brand_id);
        })

      Promise.all(promises).then((results) => {
        that.languagesComplete(true, slug);
      })
      .catch(err => {
        // Receives first rejection among the Promises
        that.languagesComplete(false, slug);
      });

      this.store('brands', _.map(brands, function(brand) {
        if (brand.id == brand_id) return _.extend(brand, {exists: true});
        return brand;
      }));
      this.uiArticlesBrandTab(brand_id);
    },
    languagesComplete: function (success, slug) {
      // Inform the user about the newly created resource
      let messages = this.store('messages') || [];
      let msg = '', type = '';

      if (success) {
        msg = 'All languages were successfully added to project';
        type = 'success';
      } else {
        let project_link = this.tx.concat('/', this.organization,
                                          '/', slug, '/languages/');
        msg = 'Some languages failed to be added to project.' +
          ' You can go to <a href="' + project_link + '">the project page</a>' +
          ' to add / remove target languages.';
        type = 'warning';
      }

      messages.push({
        type: type,
        message: msg,
      });
      this.store('messages', messages);
    },

    txProjectCreateError: function(xhr, slug) {
      io.popSync('create_project_' + slug);
      io.setPageError('txProject:login');

      // Inform the user about the newly created resource
      let messages = this.store('messages') || [];
      messages.push({
        type: 'error',
        message: 'Failed to create project in Transifex'
      });
      this.store('messages', messages);

      Sentry.captureMessage(`txProjectCreateError: [${xhr.status} ${xhr.statusText}] ${xhr.responseText || xhr.responseJSON}`);
      this.checkAsyncComplete();
    },
  },
  actionHandlers: {
    asyncGetTxProject: function() {
      logger.debug('function: [asyncGetTxProject]');
      io.setRetries('txProject', 0);
      io.pushSync(project.key);
      this.ajax('txProject')
        .done(data => {
          this.txProjectDone(data, 'OK');
        })
        .fail(xhr => {
          this.txProjectSyncError(xhr, 'error');
        });
    },
    asyncCheckTxProjectExists: function(slug) {
      logger.debug('function: [asyncGetTxProject]');
      io.pushSync('check_exists_' + slug);
      this.ajax('txProjectExists', slug)
        .done(data => {
          this.txProjectExistsDone(data, slug);
        })
        .fail(xhr => {
          this.txProjectExistsError(xhr, slug);
        });
    },
    asyncCreateTxProject: function(slug, name, source, targets, brand_id) {
      logger.debug('function: [asyncCreateTxProject]');
      io.pushSync('create_project_' + slug);
      this.ajax('txProjectCreate', slug, name, source, targets, brand_id)
        .done(data => {
          this.txProjectCreateDone(data, slug, targets, brand_id);
        })
        .fail(xhr => {
          this.txProjectCreateError(xhr, slug);
        });
    },
  },
  helpers: {
    getSourceLocale: function(p) {
      return p.source_language_code;
    },
    getLocales: function(p) {
      return p.teams;
    }
  }
};

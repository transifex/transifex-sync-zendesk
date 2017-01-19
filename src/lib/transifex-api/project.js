/**
 * The Transifex project API gets project data
 * @module transifex-api/project
 */

var logger = require('../logger'),
    io = require('../io'),
    txutils = require('../txUtil');

var project = module.exports = {
  // selfies
  name: 'zendesk-test',
  key: 'tx_project',
  url: '',
  headers: {
    'X-Source-Zendesk': 'ZendeskApp/2.1.0'
  },
  username: '',
  password: '',
  events: {
    'txProject.done': 'txProjectDone',
    'txProject.fail': 'txProjectSyncError',
    'txProjectExists.done': 'txProjectExistsDone',
    'txProjectExists.fail': 'txProjectExistsError',
    'txProjectCreate.done': 'txProjectCreateDone',
    'txProjectCreate.fail': 'txProjectCreateError',
    'txProjectAddLanguage.done': 'txProjectAddLanguageDone',
    'txProjectAddLanguage.fail': 'txProjectAddLanguageFail',
  },
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
        url: project.url,
        data: {'details': true},
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
        url: `${this.tx}/api/2/project/${project_slug}`,
        headers: project.headers,
        type: 'GET',
        cache: false,
        dataType: 'json',
        beforeSend: function(jqxhr, settings) {
          jqxhr.slug = project_slug;
        },
        cors: true
      };
    },
    txProjectCreate: function(selected_brand, locale) {
      logger.debug('txProjectCreate ajax request');
      var settings = io.getSettings();
      return {
        url: `${this.tx}/api/2/projects`,
        headers: project.headers,
        type: 'POST',
        cache: false,
        contentType: 'application/json',
        data: JSON.stringify({
          name: selected_brand.name,
          slug: selected_brand.subdomain,
          organization: txutils.extractOrgFromUrl(url).organization_slug,
          private: true,
          description: `Zendesk brand - ${selected_brand.name}`,
          source_language_code: locale
        }),
        beforeSend: function(jqxhr, settings) {
          jqxhr.slug = selected_brand.subdomain;
        },
        cors: true
      };
    },
    txProjectAddLanguage: function(selected_brand, language_code) {
      logger.debug('txProjectCreate ajax request');
      var settings = io.getSettings();
      return {
        url: `${this.tx}/api/2/project/${selected_brand.subdomain}/languages`,
        headers: project.headers,
        type: 'POST',
        cache: false,
        contentType: 'application/json',
        data: JSON.stringify({
          language_code,
          coordinators: [settings.tx_username]
        }),
        beforeSend: function(jqxhr, settings) {
          jqxhr.slug = selected_brand.subdomain;
          jqxhr.language_code = language_code;
        },
        cors: true
      };
    },
  },
  eventHandlers: {
    txProjectExistsDone: function(data, textStatus, jqXHR) {
      this.store('project_exists', true);
      io.popSync('check_exists_' + data.slug);
      this.checkAsyncComplete();
    },
    txProjectExistsError: function(data, textStatus, jqXHR) {
      this.store('project_exists', false);
      io.popSync('check_exists_' + data.slug);
      this.checkAsyncComplete();
    },
    txProjectDone: function(data, textStatus, jqXHR) {
      logger.info('Transifex Project Retrieved with status:', textStatus);
      this.store(project.key, data);
      var resource_array = _.map(data.resources, function(resource) {
        return resource.slug;
      });
      io.setResourceArray(resource_array);
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
        this.ajax('txProject');
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
      this.checkAsyncComplete();
    },
    txProjectCreateDone: function(data, textStatus, jqXHR) {
      io.popSync('create_project_' + jqXHR.slug);
      this.checkAsyncComplete();
    },
    txProjectCreateError: function(jqXHR, textStatus) {
      io.popSync('create_project_' + jqXHR.slug);
      this.checkAsyncComplete();
    },
    txProjectAddLanguageDone: function(data, textStatus, jqXHR) {
      io.popSync(`add_language_${jqXHR.slug}_${jqXHR.language_code}`);
      this.checkAsyncComplete();
    },
    txProjectAddLanguageFail: function(jqXHR, textStatus) {
      io.popSync(`add_language_${jqXHR.slug}_${jqXHR.language_code}`);
      this.checkAsyncComplete();
    },
  },
  actionHandlers: {
    asyncGetTxProject: function() {
      logger.debug('function: [asyncGetTxProject]');
      io.setRetries('txProject', 0);
      io.pushSync(project.key);
      this.ajax('txProject');
    },
    asyncCheckTxProjectExists: function(slug) {
      logger.debug('function: [asyncGetTxProject]');
      io.pushSync('check_exists_' + slug);
      this.ajax('txProjectExists', slug);
    },
    asyncCreateTxProject: function(selected_brand, locale) {
      logger.debug('function: [asyncCreateTxProject]');
      io.pushSync('create_project_' + selected_brand.subdomain);
      this.ajax('txProjectCreate', selected_brand, locale);
    },
    asyncAddLanguage: function(selected_brand, locale) {
      logger.debug('function: [asyncAddLanguage]');
      io.pushSync(`add_language_${selected_brand.subdomain}_${locale}`);
      this.ajax('txProjectAddLanguage', selected_brand, locale);
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

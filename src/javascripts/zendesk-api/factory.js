/**
 * The Zendesk resource API gets article/section/category data
 * from an existing project.
 * @module zendesk-api/factory
 */

import $ from 'jquery';

var common = require('../common'),
    io = require('../io'),
    logger = require('../logger'),
    syncUtil = require('../syncUtil'),
    txProject = require('../transifex-api/project'),
    txResource = require('../transifex-api/resource'),
    findIndex = require('lodash.findindex');

// e.g. name=Articles, key=article, api=articles
module.exports = function(name, key, api) {
  function M(expression) {
    return expression.replace('<T>', name);
  }
  //basics
  var factory = {
    key: 'zd_' + key,
    base_url: '/api/v2/help_center/',
    initialize: function() {
      var token, email,
          settings = io.getSettings();
      factory.headers = {};
      if (settings.zd_api_key) {
        email = io.getEmail();
        token = btoa(email + '/token:' + settings.zd_api_key);
        factory.headers = {
          Authorization: 'Basic ' + token,
        };
      }
    },
    requests: {
      'zdGetBrands': function() {
        return {
          url: this.base_url.substr(0,8) + 'brands.json',
          type: 'GET',
          cors: true,
          dataType: 'json'
        };
      },
      'zdGetBrandLocales': function(brand_url) {
        return {
          url: 'https://' + brand_url + '.zendesk.com/api/v2/help_center/locales.json',
          type: 'GET',
          cors: true,
          dataType: 'json',
          headers: factory.headers,
        };
      },
      'zd<T>Full': function(page, sortby, sortdirection, numperpage) {
        var locale = this.store('default_locale');
        var parameters = this[M('getEndPointParameter<T>')](
          page, sortby, sortdirection, numperpage);

        return {
            url: this.base_url + locale + '/' +  api + '.json?' + parameters['numberperpageString'] +
              parameters['pageString'] + parameters['sortbyString'] + parameters['sortdirectionString'],
            type: 'GET',
            cors: true,
            dataType: 'json',
            headers: factory.headers,
          };
      },
      'zd<T>Search': function(page, sortby, sortdirection, numperpage, search_query) {
        var parameters = this[M('getEndPointParameter<T>')](
          page, sortby, sortdirection, numperpage);

        return {
            url: this.base_url + 'articles/search.json?locale=*&query=' + search_query +
            '&' + parameters['numberperpageString'] + parameters['pageString'] +
            parameters['sortbyString'] + parameters['sortdirectionString'],
            type: 'GET',
            cors: true,
            dataType: 'json',
            headers: factory.headers,
          };
      },
      'zd<T>GetTranslations': function(id) {
        return {
          url: this.base_url + api + '/' + id + '/translations.json',
          type: 'GET',
          cors: true,
          contentType: 'application/json',
          headers: factory.headers,
        };
      },
      'zd<T>Insert': function(data, id, locale) {
        var that = this;
        io.pushSync(factory.key + 'download' + id);
        if (!this.selected_brand || this.selected_brand.default) {
          return {
            url: this.base_url + api + '/' + id +
              '/translations.json',
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json'
          };
        } else { // Pass it through Transifex Proxy
          return {
            url: this.get_upsert_url('HTML-' + api + '-' + id),
            type: 'POST',
            cors: true,
            data: JSON.stringify({
              translations_json: data,
              zendesk_url: this.base_url + api + '/' + id +
                '/translations.json',
              username: io.getEmail(),
              token: this.settings.zd_api_key,
            }),
            contentType: 'application/json',
            headers: txProject.headers,
          };
        }
      },
      'zd<T>Update': function(data, id, locale) {
        var that = this;
        io.pushSync(factory.key + 'download' + id + locale);
        if (!this.selected_brand || this.selected_brand.default) {
          return {
            url: this.base_url + api + '/' + id + '/translations/' +
              locale + '.json',
            type: 'PUT',
            data: JSON.stringify(data),
            contentType: 'application/json'
          };
        } else { // Pass it through Transifex Proxy
          return {
            url: this.get_upsert_url('HTML-' + api + '-' + id),
            type: 'POST',
            cors: true,
            data: JSON.stringify({
              translations_json: data,
              zendesk_url: this.base_url + api + '/' + id +
                '/translations.json',
              username: io.getEmail(),
              token: this.settings.zd_api_key,
            }),
            contentType: 'application/json',
            headers: txProject.headers,
          };
        }
      },
    },
    eventHandlers: {
      'zdGetBrandsDone': function(data) {
        io.popSync('brands');
        // Assume that the first brand is the project slug
        // at zendesk configuration
        this.zafClient.get('currentAccount.subdomain')
          .then(response => {
            var subdomain = response['currentAccount.subdomain'];
            var agent_index = findIndex(data.brands, {subdomain: subdomain});
            var def_index = findIndex(data.brands, {default: true});
            data.brands[agent_index].exists = true;
            // For all indents and purposes in this app the default brand will
            // be the brand associated with the main subdomain of the account
            if (agent_index !== def_index ) {
              data.brands[agent_index].default = true;
              data.brands[def_index].default = false;
              def_index = agent_index;
            }
            _.extend(this.selected_brand, data.brands[def_index]);
            this.store('brands', data.brands);
            data.brands = _.reject(data.brands, {default: true});
            // Check if brand slug exists in transifex
            _.each(data.brands, function(brand) {
              this.asyncCheckTxProjectExists('zd-' + this.organization + '-' + brand.id);
            }, this);
            // Should be removed
            this.checkAsyncComplete();
          });
      },
      'zdGetBrandsError': function(jqXHR) {
        logger.info('Brands not retrieved: ', jqXHR.statusText);
        this.store('brands', []);
        io.popSync('brands');
        this.checkAsyncComplete();
      },
      'zdGetBrandLocalesDone': function(data, brand_url) {
        io.popSync('brandLocales_' + brand_url);

        this.store('brandLocales', _.compact(_.map(
          _.filter(data.locales, function(locale) {
              return locale !== data.default_locale;
          }),
          function(locale) {
            return _.find(io.getLocalesObj(), { locale: locale });
          }
        )));
        this.store('brandSource', _.find(io.getLocalesObj(), function(l) {
          return l.locale.toLowerCase() === data.default_locale;
        }));
        this.checkAsyncComplete();
      },
      'zdGetBrandLocalesError': function(jqXHR, brand_url) {
        io.popSync('brandLocales_' + brand_url);
        this.checkAsyncComplete();
      },
      'zd<T>Done': function(data) {
        logger.info(M('Zendesk <T> retrieved with status:'), 'OK');
        //map category/section name to title
        if (data) {
          if (data.categories) {
            _.each(data.categories, function(entry) {
              entry.title = entry.name;
            });
          }
          if (data.sections) {
            _.each(data.sections, function(entry) {
              entry.title = entry.name;
            });
          }
        }
        this.store(factory.key, data);
        logger.debug('done, removing key');
        io.popSync(factory.key);
        this.checkAsyncComplete();
      },
      'zd<T>SyncError': function(jqXHR) {
        logger.info(M('Zendesk <T> Retrieved with status:'), jqXHR.statusText);
        io.popSync(factory.key);
        //this.uiErrorPageInit();
        if (jqXHR.status === 401) {
          logger.error(M('zd<T>SyncError'), 'Login error');
          io.setPageError('zdSync:login');
        }
        else {
          io.setPageError('zdSync');
        }
        this.checkAsyncComplete();
      },
      'zd<T>GetTranslationsDone': function(data, entryid) {
        logger.info(M('Zendesk <T> Translations retrieved with status:'), 'OK');
        let existing_locales = _.map(data['translations'], t => t['locale']);
        this.store(factory.key + entryid + '_locales', existing_locales);
        io.popSync(factory.key + entryid);
        this.checkAsyncComplete();
      },
      'zd<T>InsertDone': function(data, entryid, locale) {
        var key = factory.key + entryid + '_locales';
        var existing_locales = this.store(key);
        existing_locales.push(locale);
        this.store(key, existing_locales);

        io.popSync(factory.key + 'download' + entryid);
        io.opSet(entryid + '_' + locale, 'success');
        logger.info('Transifex Resource inserted with status:', 'OK');
        this.zdUpsertTranslationNext();
      },
      'zd<T>UpdateDone': function(data, entryid, locale) {
        io.popSync(factory.key + 'download' + entryid + locale);
        io.opSet(entryid + '_' + locale, 'success');
        logger.info('Transifex Resource updated with status: OK');
        this.zdUpsertTranslationNext();
      },
      'zd<T>InsertFail': function(jqXHR, entryid, locale) {
        io.popSync(factory.key + 'download' + entryid);
        io.opSet(entryid + '_' + locale, jqXHR.statusText);
        logger.info('Transifex Resource update failed with status:', jqXHR.statusText);
        this.zdUpsertTranslationNext();
      },
      'zd<T>UpdateFail': function(jqXHR, entryid, locale) {
        io.popSync(factory.key + 'download' + entryid + locale);
        io.opSet(entryid + '_' + locale, jqXHR.statusText);
        logger.info('Transifex Resource update failed with status:', jqXHR.statusText);
        this.zdUpsertTranslationNext();
      },
      'zd<T>SearchDone': function(data) {
        logger.info(M('Zendesk Search <T> retrieved with status:'), 'OK');
        data['articles'] = data['results'];
        delete data['results'];
        this.store(factory.key, data);
        logger.debug('done, removing key');
        io.popSync(factory.key);
        this.checkAsyncComplete();
      },
    },
    actionHandlers: {
      'zdGetBrands': function() {
        io.pushSync('brands');
        this.ajax('zdGetBrands')
          .done(data => this.zdGetBrandsDone(data))
          .fail(xhr => this.zdGetBrandsError(xhr));
      },
      'zdGetBrandLocales': function(brand_url) {
        io.pushSync('brandLocales_' + brand_url);
        this.ajax('zdGetBrandLocales', brand_url)
          .done(data => this.zdGetBrandLocalesDone(data, brand_url))
          .fail(xhr => this.zdGetBrandLocalesError(xhr, brand_url));
      },
      'zdUpsert<T>Translation': function(resource_data, entryid, zdLocale) {
        const that = this;
        logger.info(M('Upsert <T> with Id:') + entryid + 'and locale:' + zdLocale);
        var translationData = common.translationObjectFormat(resource_data, zdLocale, key);

        var existing_locales = this.store(factory.key + entryid + '_locales');
        var checkLocaleExists = _.any(existing_locales, function(l){
          return l == zdLocale;
        });
        
        if (checkLocaleExists) {
          syncUtil.zdRetriableOperation(this.ajax(M('zd<T>Update'), translationData, entryid, zdLocale), 5,
            (data) => that[M("zd<T>UpdateDone")](data, entryid, zdLocale),
            (xhr, error) => {
              that[M("zd<T>UpdateFail")](xhr, entryid, zdLocale);
            });        
        } else {
          syncUtil.zdRetriableOperation(this.ajax(M('zd<T>Insert'), translationData, entryid, zdLocale), 5,
            (data) => that[M("zd<T>InsertDone")](data, entryid, zdLocale),
            (xhr, error) => {
              that[M("zd<T>InsertFail")](xhr, entryid, zdLocale);
            });            
        }
      },
      'asyncGetZd<T>Translations': function(id) {
        logger.debug(M('function: [asyncGetZd<T>Translation]'));
        io.pushSync(factory.key + id);
        this.ajax(M('zd<T>GetTranslations'), id)
          .done(data => this[M("zd<T>GetTranslationsDone")](data, id))
          .fail(xhr => this[M("zd<T>SyncError")](xhr));
      },
      'asyncGetZd<T>Full': function(page, sortby, sortdirection, numperpage, search_query) {
        logger.debug(M('function: [asyncGetZd<T>Full] params: [page]') +
          page + '[sortby]' + sortby + '[sortdirection]' + sortdirection +
          '[numperpage]' + numperpage);
        io.pushSync(factory.key);

        if(search_query){
          this.ajax(M('zd<T>Search'), page, sortby, sortdirection, numperpage, search_query)
            .done(data => this[M("zd<T>SearchDone")](data));
        }
        else{
          this.ajax(M('zd<T>Full'), page, sortby, sortdirection, numperpage)
            .done(data => this[M("zd<T>Done")](data))
            .fail(xhr => this[M("zd<T>SyncError")](xhr));
        }
      },
      'get<T>ForTranslation': function(entry){
        // apply any required transformation before passing it to template
        return {
          resource_name: entry.resource_name,
          body: entry.body || entry.description,
          name: entry.name,
          title: entry.title || entry.name,
        };
      },
      zdUpsertBatchTranslations: function(resourceList) {
        this.store('batchTranslations', resourceList);
        this.zdUpsertTranslationNext();
      },
      zdUpsertTranslationNext: function() {
        /**
         * Take the next resource of the batchArray and try to upsert it.
         */
        let resources = this.store('batchTranslations');
        if (!resources.length) {
          // When the pull is complete, we save the translations to Zendesk.
          this.notifyReset();
          this.notifyInfo(`Updating Zendesk translation files. ${io.syncLength()} files left.`);
          this.checkAsyncComplete();
          return;
        }
        this.notifyReset();
        // Get the next translation to upsert
        let entry = resources.shift();
        this.store('batchTranslations', resources);
        let txResourceName = entry.resource_name;
        let resource = this.store(txResource.key + txResourceName);
        let completedLocales = this.completedLanguages(resource);

        let msg = `Getting translation in <b>${completedLocales.length} languages</b> for resource <b>${entry.title}</b>`
        if (resources.length > 0)
          msg = `${msg}.</br>${resources.length} resources queued.`;
        this.notifyInfo(msg);
        for (var i = 0; i < completedLocales.length; i++) { // iterate through list of locales
          this.asyncGetTxResource(txResourceName, completedLocales[i], entry.id);
        }
      },
    },
    helpers: {
      'getEndPointParameter<T>': function(page, sortby, sortdirection, numperpage){
        var numberperpageString = "";
        if (numperpage) {
          numberperpageString = "per_page=" + numperpage;
        } else {
          numberperpageString = "per_page=10";
        }

        var pageString = "";
        if (page) {
          pageString = '&page=' + page;
        }

        var sortbyString = "";
        if (sortby) {
          //sections and categories sort by position instead of title
          if (sortby == 'title' && key != 'article') {
            sortby = 'position';
          }
          sortbyString = '&sort_by=' + sortby;
        }

        var sortdirectionString = "";
        if (sortdirection) {
          //sections and categories should invert direction
          if (sortby == 'title' && key != 'article') {
            sortdirectionString = (sortdirectionString == 'asc')?'desc':'asc';
          }
          sortdirectionString = '&sort_order=' + sortdirection;
        }
        return {'numberperpageString': numberperpageString, 'pageString':pageString,
                'sortbyString': sortbyString, 'sortdirectionString': sortdirectionString};
      },
      'calcResourceName<T>': function(obj) {
        var ret = obj[api];
        var type = api;
        if (io.getFeature('html-tx-resource')) {
          type = 'HTML-' + type;
        }
        var typeString = type + '-';
        // Get the array key and use it as a type
        var limit = obj[api].length;
        for (var i = 0; i < limit; i++) {
          ret[i] = _.extend(ret[i], {
            resource_name: typeString + ret[i].id
          });
        }
        var response = {};
        response[api] = ret;
        return response;
      },
      get_upsert_url: function(resource_slug) {
        // org, project and resource slug
        var slugs = [
          this.organization,
          'zd-' + this.organization + '-' + this.selected_brand.id,
          resource_slug,
        ];
        return this.tx + '/' + slugs.join('/') + '/upsert_zendesk/';
      }
    },
  };

  _.each(['events', 'requests', 'eventHandlers', 'actionHandlers', 'helpers'], function(entry) {
    var object = factory[entry];
    _.each(object, function(value, key) {
      delete object[key];
      object[M(key)] = value;
    });
  });

  return factory;
};

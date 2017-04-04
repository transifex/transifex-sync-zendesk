/**
 * The Zendesk resource API gets article/section/category data
 * from an existing project.
 * @module zendesk-api/factory
 */

var common = require('../common'),
    io = require('../io'),
    logger = require('../logger'),
    txProject = require('../transifex-api/project');

// e.g. name=Articles, key=article, api=articles
module.exports = function(name, key, api) {
  function M(expression) {
    return expression.replace('<T>', name);
  }
  //basics
  var factory = {
    key: 'zd_' + key,
    base_url: '/api/v2/help_center/',
    events: {
      'zd<T>Full.done': M('zd<T>Done'),
      'zd<T>GetTranslations.done': M('zd<T>GetTranslationsDone'),
      'zd<T>Update.done': M('zd<T>UpdateDone'),
      'zd<T>Insert.done': M('zd<T>InsertDone'),
      'zd<T>Update.fail': M('zd<T>UpdateFail'),
      'zd<T>Insert.fail': M('zd<T>InsertFail'),
      'zd<T>GetTranslations.fail': M('zd<T>SyncError'),
      'zd<T>Full.fail': M('zd<T>SyncError'),
      'zd<T>Search.done': M('zd<T>SearchDone'),
      'zdGetBrands.done': 'zdGetBrandsDone',
      'zdGetBrands.fail': 'zdGetBrandsError',
      'zdGetBrandLocales.done': 'zdGetBrandLocalesDone',
      'zdGetBrandLocales.fail': 'zdGetBrandLocalesError',
      'zdGetLocales.done': 'zdGetLocalesDone',
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
          beforeSend: function(jqxhr, settings) {
            jqxhr.brand_url = brand_url;
          },
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
            dataType: 'json'
          };
      },
      'zd<T>Search': function(page, sortby, sortdirection, numperpage, search_query) {
        var parameters = this[M('getEndPointParameter<T>')](
          page, sortby, sortdirection, numperpage);

        return {
            url: this.base_url + 'articles/search.json?query=' + search_query +
            '&' + parameters['numberperpageString'] + parameters['pageString'] +
            parameters['sortbyString'] + parameters['sortdirectionString'],
            type: 'GET',
            cors: true,
            dataType: 'json'
          };
      },
      'zd<T>GetTranslations': function(id) {
        return {
          url: this.base_url + api + '/' + id + '/translations.json',
          type: 'GET',
          cors: true,
          beforeSend: function(jqxhr, settings) {
            jqxhr.id = id;
          },
          contentType: 'application/json'
        };
      },
      'zd<T>Insert': function(data, id) {
        var that = this;
        io.pushSync(factory.key + 'download' + id);
        if (!this.selected_brand || this.selected_brand.default) {
          return {
            url: this.base_url + api + '/' + id +
              '/translations.json',
            type: 'POST',
            data: JSON.stringify(data),
            beforeSend: function(jqxhr, settings) {
              jqxhr.id = id;
            },
            contentType: 'application/json'
          };
        } else { // Pass it through Transifex Proxy
          return {
            url: this.tx + '/'  + this.organization + '/zd-' + this.organization + '-' + this.selected_brand.id + '/HTML-' + api + '-' + id + '/upsert_zendesk/',
            type: 'POST',
            cors: true,
            data: JSON.stringify({
              translations_json: data,
              zendesk_url: this.base_url + api + '/' + id +
                '/translations.json',
              username: this.currentUser().email(),
              token: this.settings.zd_api_key,
            }),
            beforeSend: function(jqxhr, settings) {
              jqxhr.id = id;
            },
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
            beforeSend: function(jqxhr, settings) {
              jqxhr.id = id;
              jqxhr.locale = locale;
            },
            contentType: 'application/json'
          };
        } else { // Pass it through Transifex Proxy
          return {
            url: this.tx + '/'  + this.organization + '/zd-' + this.organization + '-' + this.selected_brand.id + '/HTML-' + api + '-' + id + '/upsert_zendesk/',
            type: 'POST',
            cors: true,
            data: JSON.stringify({
              translations_json: data,
              zendesk_url: this.base_url + api + '/' + id +
                '/translations.json',
              username: this.currentUser().email(),
              token: this.settings.zd_api_key,
            }),
            beforeSend: function(jqxhr, settings) {
              jqxhr.id = id;
              jqxhr.locale = locale;
            },
            contentType: 'application/json',
            headers: txProject.headers,
          };
        }
      },
    },
    eventHandlers: {
      'zdGetBrandsDone': function(data, textStatus) {
        io.popSync('brands');
        // Assume that the first brand is the project slug
        // at zendesk configuration
        var def_index = _.findIndex(data.brands, {default: true});
        data.brands[def_index].exists = true;
        _.extend(this.selected_brand, data.brands[def_index]);
        this.store('brands', data.brands);
        data.brands = _.reject(data.brands, {default: true});
        // Check if brand slug exists in transifex
        _.each(data.brands, function(brand) {
          this.asyncCheckTxProjectExists('zd-' + this.organization + '-' + brand.id);
        }, this);
        // Should be removed
        this.checkAsyncComplete();
      },
      'zdGetBrandsError': function(jqXHR, textStatus) {
        logger.info('Brands not retrieved: ', textStatus);
        this.store('brands', []);
        io.popSync('brands');
        this.checkAsyncComplete();
      },
      'zdGetBrandLocalesDone': function(data, textStatus, jqXHR) {
        io.popSync('brandLocales_' + jqXHR.brand_url);

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
      'zdGetBrandLocalesError': function(jqXHR, textStatus) {
        io.popSync('brandLocales_' + jqXHR.brand_url);
        this.checkAsyncComplete();
      },
      'zd<T>Done': function(data, textStatus) {
        logger.info(M('Zendesk <T> retrieved with status:'), textStatus);
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
      'zd<T>SyncError': function(jqXHR, textStatus) {
        logger.info(M('Zendesk <T> Retrieved with status:'), textStatus);
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
      'zd<T>GetTranslationsDone': function(data, textStatus, jqXHR) {
        logger.info(M('Zendesk <T> Translations retrieved with status:'), textStatus);
        var existing_locales = _.map(data['translations'], function(t){
          return t['locale'];
        });
        this.store(factory.key + jqXHR.id + '_locales', existing_locales);
        io.popSync(factory.key + jqXHR.id);
        this.checkAsyncComplete();
      },
      'zd<T>InsertDone': function(data, textStatus, jqXHR) {
        var key = factory.key + jqXHR.id + '_locales';
        var existing_locales = this.store(key);
        existing_locales.push(jqXHR.locale);
        this.store(key, existing_locales);

        io.popSync(factory.key + 'download' + jqXHR.id);
        io.opSet(jqXHR.id + '_' + jqXHR.locale, textStatus);
        logger.info('Transifex Resource inserted with status:', textStatus);
        this.checkAsyncComplete();
      },
      'zd<T>UpdateDone': function(data, textStatus, jqXHR) {
        io.popSync(factory.key + 'download' + jqXHR.id + jqXHR.locale);
        io.opSet(jqXHR.id + '_' + jqXHR.locale, textStatus);
        logger.info('Transifex Resource updated with status:', textStatus);
        this.checkAsyncComplete();
      },
      'zd<T>InsertFail': function(jqXHR, textStatus) {
        io.popSync(factory.key + 'download' + jqXHR.id);
        io.opSet(jqXHR.id + '_' + jqXHR.locale, textStatus);
        logger.info('Transifex Resource update failed with status:', textStatus);
        this.checkAsyncComplete();
      },
      'zd<T>UpdateFail': function(jqXHR, textStatus) {
        io.popSync(factory.key + 'download' + jqXHR.id + jqXHR.locale);
        io.opSet(jqXHR.id + '_' + jqXHR.locale, textStatus);
        logger.info('Transifex Resource update failed with status:', textStatus);
        this.checkAsyncComplete();
      },
      'zd<T>SearchDone': function(data, textStatus) {
        logger.info(M('Zendesk Search <T> retrieved with status:'), textStatus);
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
        this.ajax('zdGetBrands');
      },
      'zdGetBrandLocales': function(brand_url) {
        io.pushSync('brandLocales_' + brand_url);
        this.ajax('zdGetBrandLocales', brand_url);
      },
      'zdUpsert<T>Translation': function(resource_data, entry, zdLocale) {
        logger.info(M('Upsert <T> with Id:') + entry.id + 'and locale:' + zdLocale);
        var translationData = common.translationObjectFormat(this.$, resource_data, zdLocale, key);

        var existing_locales = this.store(factory.key + entry.id + '_locales');
        var checkLocaleExists = _.any(existing_locales, function(l){
          return l == zdLocale;
        });
        if (checkLocaleExists) {
          this.ajax(M('zd<T>Update'), translationData, entry.id, zdLocale);
        } else {
          this.ajax(M('zd<T>Insert'), translationData, entry.id, zdLocale);
        }
      },
      'asyncGetZd<T>Translations': function(id) {
        logger.debug(M('function: [asyncGetZd<T>Translation]'));
        io.pushSync(factory.key + id);
        this.ajax(M('zd<T>GetTranslations'), id);
      },
      'asyncGetZd<T>Full': function(page, sortby, sortdirection, numperpage, search_query) {
        logger.debug(M('function: [asyncGetZd<T>Full] params: [page]') +
          page + '[sortby]' + sortby + '[sortdirection]' + sortdirection +
          '[numperpage]' + numperpage);
        io.pushSync(factory.key);

        if(search_query){
          this.ajax(M('zd<T>Search'), page, sortby, sortdirection, numperpage, search_query);
        }
        else{
          this.ajax(M('zd<T>Full'), page, sortby, sortdirection, numperpage);
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

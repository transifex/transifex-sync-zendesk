/**
 * The Zendesk resource API gets article/section/category data
 * from an existing project.
 * @module zendesk-api/factory
 */

var common = require('../common'),
    io = require('../io'),
    logger = require('../logger');

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
    },
    requests: {
      'zd<T>Full': function(page, sortby, sortdirection, numperpage) {
        var locale = this.store('default_locale');
        var parameters = this[M('getEndPointParameter<T>')](
          page, sortby, sortdirection, numperpage)

        return {
            url: factory.base_url + locale + '/' +  api + '.json?' + parameters['numberperpageString'] +
              parameters['pageString'] + parameters['sortbyString'] + parameters['sortdirectionString'],
            type: 'GET',
            dataType: 'json'
          };
      },
      'zd<T>Search': function(page, sortby, sortdirection, numperpage) {
        var parameters = this[M('getEndPointParameter<T>')](
          page, sortby, sortdirection, numperpage)

        return {
            url: factory.base_url + 'articles/search.json?query=' + search_query +
            '&' + parameters['numberperpageString'] + parameters['pageString'] +
            parameters['sortbyString'] + parameters['sortdirectionString'],
            type: 'GET',
            dataType: 'json'
          };
      },
      'zd<T>GetTranslations': function(id) {
        return {
          url: factory.base_url + api + '/' + id + '/translations.json',
          type: 'GET',
          beforeSend: function(jqxhr, settings) {
            jqxhr.id = id;
          },
          contentType: 'application/json'
        };
      },
      'zd<T>Insert': function(data, id) {
        io.pushSync(factory.key + 'download' + id);
        return {
          url: factory.base_url + api + '/' + id +
            '/translations.json',
          type: 'POST',
          data: JSON.stringify(data),
          beforeSend: function(jqxhr, settings) {
            jqxhr.id = id;
          },
          contentType: 'application/json'
        };
      },
      'zd<T>Update': function(data, id, locale) {
        io.pushSync(factory.key + 'download' + id + locale);
        return {
          url: factory.base_url + api + '/' + id + '/translations/' +
            locale + '.json',
          type: 'PUT',
          data: JSON.stringify(data),
          beforeSend: function(jqxhr, settings) {
            jqxhr.id = id;
            jqxhr.locale = locale;
          },
          contentType: 'application/json'
        };
      },
    },
    eventHandlers: {
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
        var existing_locales = this.store(factory.key + jqXHR.id + '_locales');
        existing_locales.push(jqXHR.locale);
        this.store(factory.key + jqXHR.id + '_locales', existing_locales);

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
      'zdUpsert<T>Translation': function(resource_data, id, zdLocale) {
        logger.info(M('Upsert <T> with Id:') + id + 'and locale:' + zdLocale);

        var translationData = common.translationObjectFormat(resource_data, zdLocale, key);

        var existing_locales = this.store(factory.key + id + '_locales');
        var checkLocaleExists = _.any(existing_locales, function(l){
          return l == zdLocale;
        });
        if (checkLocaleExists) {
          this.ajax(M('zd<T>Update'), translationData, id, zdLocale);
        } else {
          this.ajax(M('zd<T>Insert'), translationData, id);
        }
      },
      'asyncGetZd<T>Translations': function(id) {
        logger.debug(M('function: [asyncGetZd<T>Translation]'));
        io.pushSync(factory.key + id);
        this.ajax(M('zd<T>GetTranslations'), id);
      },
      'asyncGetZd<T>Full': function(page, sortby, sortdirection, numperpage) {
        logger.debug(M('function: [asyncGetZd<T>Full] params: [page]') +
          page + '[sortby]' + sortby + '[sortdirection]' + sortdirection +
          '[numperpage]' + numperpage);
        io.pushSync(factory.key);
        search_query = this.store("search_query");
        if(key == 'article' && search_query != '' ){
          this.ajax(M('zd<T>Search'), page, sortby, sortdirection, numperpage);
        }
        else{
          this.ajax(M('zd<T>Full'), page, sortby, sortdirection, numperpage);
        }
      },
    },
    jsonHandlers: {
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
                'sortbyString': sortbyString, 'sortdirectionString': sortdirectionString}
      },
      'getSingle<T>': function(id, a) {
        if (typeof id == 'string' || id instanceof String)
          id = parseInt(id, 10);
        var i = _.findIndex(a[api], {
          id: id
        });
        return a[api][i];
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
      'checkPagination<T>': function(a) {
        var i = a.page_count;
        if (typeof i === 'string') {
          i = parseInt(i, 10);
        }
        if (typeof i === 'number') {
          if (i > 1) {
            return true;
          }
        }
        return false;
      },
      'getPages<T>': function(a) {
        var i = a.page_count;
        return _.range(1, i + 1);
      },
      'getCurrentPage<T>': function(a) {
        var i = a.page;
        return i;
      },
      'isFewer<T>': function(a, i) {
        if (i > 1) {
          return true;
        }
        return false;
      },
      'isMore<T>': function(a, i) {
        if (a.page_count > i) {
          return true;
        }
        return false;
      },
    },
  };

  _.each(['events', 'requests', 'eventHandlers', 'actionHandlers', 'jsonHandlers'], function(entry) {
    var object = factory[entry];
    _.each(object, function(value, key) {
      delete object[key];
      object[M(key)] = value;
    });
  });

  return factory;
};

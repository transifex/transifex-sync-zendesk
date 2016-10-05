/**
 * The Zendesk resource API gets article/section/category data
 * from an existing project.
 * @module zendesk-api/factory
 */

var common = require('../common'),
    io = require('../io'),
    logger = require('../logger'),
    syncUtil = require('../syncUtil'),
    txProject = require('transifex-api/project'),
    txResource = require('transifex-api/resource');

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
    },
    requests: {
      'zd<T>Full': function(page, sortby, sortdirection, numperpage) {
        var locale = this.store('default_locale');
        var numberperpageString = "";
        if (numperpage) {
          numberperpageString = "?per_page=" + numperpage;
        } else {
          numberperpageString = "?per_page=10";
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
        return {
          url: factory.base_url + locale + '/' +  api + '.json' + numberperpageString +
            pageString + sortbyString + sortdirectionString,
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
    },
    actionHandlers: {
      'zdUpsert<T>Translations': function(entry) {
        logger.info(M('Upsert <T> with Id:') + entry.id);
        var translation_data, zd_locale,
            project = this.store(txProject.key),
            existing_locales = this.store(factory.key + entry.id + '_locales'),
            resource = this.store(txResource.key + entry.resource_name),
            tx_completed = this.completedLanguages(resource),
            sourceLocale = this.getSourceLocale(project);

        for (var i = 0; i < tx_completed.length; i++) { // iterate through list of locales
          if (sourceLocale !== tx_completed[i]) { // skip the source locale
            translation_data = this.store(
              txResource.key + entry.resource_name + tx_completed[i]
            );
            zd_locale = syncUtil.txLocaletoZd(tx_completed[i]);
            translation_data = common.translationObjectFormat(
              translation_data.content, zd_locale, factory.key
            );

            if (syncUtil.isStringinArray(zd_locale, existing_locales)) {
              this.ajax(M('zd<T>Update'), translation_data, entry.id, zd_locale);
            } else {
              this.ajax(M('zd<T>Insert'), translation_data, entry.id);
            }
          }
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
        this.ajax(M('zd<T>Full'), page, sortby, sortdirection, numperpage);
      },
      'get<T>ForTranslation': function(entry){
        // apply any required transformation before passing it to template
        return {
          resource_name: entry.resource_name,
          body: entry.body || entry.description
        };
      },
    },
    helpers: {
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

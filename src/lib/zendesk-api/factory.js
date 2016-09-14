/**
 * The Zendesk resource API gets article data
 * from an existing project.
 * @module zendesk-api/articles
 */

var common = require('../common'),
    io = require('../io'),
    logger = require('../logger');

// e.g. name=Articles, key=article, api=articles
module.exports = function(name, key, api) {
  function m(expression) {
    return expression.replace('<T>', name);
  }
  //basics
  var factory = {
    key: 'zd_' + key,
    base_url: '/api/v2/help_center/',
    timeout: 500,
    STRING_RADIX: 10,
    events: {},
    requests: {},
    eventHandlers: {},
    actionHandlers: {},
    jsonHandlers: {},
  };

  // ---------------------------------------------------------------------------

  //events
  factory.events[m('zd<T>Full.done')] = m('zd<T>Done');
  factory.events[m('zd<T>GetTranslations.done')] = m('zd<T>GetTranslationsDone');
  factory.events[m('zd<T>Update.done')] = m('zd<T>UpdateDone');
  factory.events[m('zd<T>Insert.done')] = m('zd<T>InsertDone');
  factory.events[m('zd<T>GetTranslations.fail')] = m('zd<T>SyncError');
  factory.events[m('zd<T>Full.fail')] = m('zd<T>SyncError');

  // ---------------------------------------------------------------------------

  //requests
  factory.requests[m('zd<T>Full')] = function(page, sortby, sortdirection, numperpage) {
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
      url: factory.base_url + 'en-us/' + api + '.json' + numberperpageString +
        pageString + sortbyString + sortdirectionString,
      type: 'GET',
      dataType: 'json'
    };
  };

  factory.requests[m('zd<T>SLTranslations')] = function() {
    return {
      url: factory.base_url + api + '.json?include=translations',
      type: 'GET',
      dataType: 'json'
    };
  };

  factory.requests[m('zd<T>GetTranslations')] = function(id) {
    return {
      url: factory.base_url + api + '/' + id + '/translations',
      type: 'GET',
      beforeSend: function(jqxhr, settings) {
        jqxhr.id = id;
      },
      contentType: 'application/json'
    };
  };

  factory.requests[m('zd<T>Insert')] = function(data, id) {
    return {
      url: factory.base_url + api + '/' + id +
        '/translations.json',
      type: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json'
    };
  };

  factory.requests[m('zd<T>Update')] = function(data, id, locale) {
    return {
      url: factory.base_url + api + '/' + id + '/translations/' +
        locale + '.json',
      type: 'PUT',
      data: JSON.stringify(data),
      contentType: 'application/json'
    };
  };

  // ---------------------------------------------------------------------------

  // Event handlers
  factory.eventHandlers[m('zd<T>Done')] = function(data, textStatus) {
    logger.info(m('Zendesk <T> retrieved with status:'), textStatus);
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
  };

  factory.eventHandlers[m('zd<T>SyncError')] = function(jqXHR, textStatus) {
    logger.info(m('Zendesk <T> Retrieved with status:'), textStatus);
    io.popSync(factory.key);
    this.checkAsyncComplete();
    //this.uiErrorPageInit();
    if (jqXHR.status === 401) {
      logger.error(m('zd<T>SyncError'), 'Login error');
      //this.updateMessage("txLogin", "error");
    }
  };

  factory.eventHandlers[m('zd<T>GetTranslationsDone')] = function(data, textStatus, jqXHR) {
    logger.info(m('Zendesk <T> Translations retrieved with status:'), textStatus);
    io.popSync(factory.key + jqXHR.id);
    this.checkAsyncComplete();
  };

  factory.eventHandlers[m('zd<T>InsertDone')] = function(data, textStatus) {
    logger.info('Transifex Resource inserted with status:', textStatus);
  };

  factory.eventHandlers[m('zd<T>UpdateDone')] = function(data, textStatus) {
    logger.info('Transifex Resource updated with status:', textStatus);
  };

  // ---------------------------------------------------------------------------

  factory.actionHandlers[m('zdUpsert<T>Translation')] = function(resource_data, id, zdLocale) {
    logger.info(m('Upsert <T> with Id:') + id + 'and locale:' + zdLocale);

    /* var localeRegion = zdLocale.split('-');
     if (localeRegion.length > 1 && localeRegion[0] == localeRegion[1]) {
       zdLocale = localeRegion[0];
     }
     */
    var translationData;
    if (io.hasFeature('html-tx-resource')) {
      translationData = common.translationObjectFormat('html-tx-resource',
        resource_data, zdLocale);
    } else {
      translationData = common.translationObjectFormat('',
        resource_data, zdLocale);
    }
    /*
    var i = _.findIndex(locales, {
      id: parseInt(id, 10)
    });
    */
    var translations = this.store(factory.key + id);
    var checkLocaleExists = (typeof translations[zdLocale] ===
      'undefined') ? false : true;
    if (checkLocaleExists) {
      this.ajax(m('zd<T>Update'), translationData, id, zdLocale);
    } else {
      this.ajax(m('zd<T>Insert'), translationData, id);
    }
  };

  factory.actionHandlers[m('asyncGetZd<T>Translations')] = function(id) {
    logger.debug(m('function: [asyncGetZd<T>Translation]'));
    io.pushSync(factory.key + id);
    var that = this;
    setTimeout(
      function() {
        that.ajax(m('zd<T>GetTranslations'), id);
      }, factory.timeout);
  };

  factory.actionHandlers[m('asyncGetZd<T>Full')] = function(page, sortby, sortdirection, numperpage) {
    logger.debug(m('function: [asyncGetZd<T>Full] params: [page]') +
      page + '[sortby]' + sortby + '[sortdirection]' + sortdirection +
      '[numperpage]' + numperpage);
    io.pushSync(factory.key);
    var that = this;
    setTimeout(
      function() {
        that.ajax(m('zd<T>Full'), page, sortby, sortdirection,
          numperpage);
      }, factory.timeout);
  };

  // ---------------------------------------------------------------------------

  factory.jsonHandlers[m('getSingle<T>')] = function(id, a) {
    if (typeof id == 'string' || id instanceof String)
      id = parseInt(id, factory.STRING_RADIX);
    var i = _.findIndex(a[api], {
      id: id
    });
    return a[api][i];
  };

  factory.jsonHandlers[m('calcResourceName<T>')] = function(obj) {
    var ret = obj[api];
    var type = api;
    if (io.hasFeature('html-tx-resource')) {
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
  };

  factory.jsonHandlers[m('getName<T>')] = function(id, a) {
    if (a[api] instanceof Array) {
      var i = _.findIndex(a[api], {
        id: id
      });
      return a[api][i]["name"];
    } else {
      return a.name;
    }
  };

  factory.jsonHandlers[m('getTitle<T>')] = function(id, a) {
    if (a[api] instanceof Array) {
      var i = _.findIndex(a[api], {
        id: id
      });
      return a[api][i]["title"];
    } else {
      return a.title;
    }
  };

  factory.jsonHandlers[m('getBody<T>')] = function(id, a) {
    if (a[api] instanceof Array) {
      var i = _.findIndex(a[api], {
        id: id
      });
      return a[api][i]["body"];
    } else {
      return a.body;
    }
  };

  factory.jsonHandlers[m('checkPagination<T>')] = function(a) {
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
  };

  factory.jsonHandlers[m('getPages<T>')] = function(a) {
    var i = a.page_count;
    return _.range(1, i + 1);
  };

  factory.jsonHandlers[m('getCurrentPage<T>')] =  function(a) {
    var i = a.page;
    return i;
  };

  factory.jsonHandlers[m('isFewer<T>')] = function(a, i) {
    if (i > 1) {
      return true;
    }
    return false;
  };

  factory.jsonHandlers[m('isMore<T>')] = function(a, i) {
    if (a.page_count > i) {
      return true;
    }
    return false;
  };

  return factory;
};

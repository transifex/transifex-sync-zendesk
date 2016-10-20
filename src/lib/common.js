var zdArticle = require('zendesk-api/article');
var txResource = require('transifex-api/resource');
var syncUtil = require('syncUtil');
var io = require('io');

var common = module.exports = {
  gblTemplate: "<html><head></head><body><h1><%= title %></h1><%= body %></body></html>",
  translationObjectFormat: function($, response, locale, zd_type) {
    if (io.getFeature('html-tx-resource')) {
      return common.translationObjectHTML($, response, locale, zd_type);
    } else {
      return syncUtil.zdGetTranslationObject(response, locale, zd_type);
    }
  },

  translationObjectHTML: function($, res, l, zd_type) {
    var el = $('<div></div>'),
        title, body;
    el.html(res);
    title = el.find('h1').first().text();
    el.find('h1').first().remove();
    body = el.html().trim();
    el.remove();
    var zdPartialArticle = {
      title: title,
      body: body
    };
    var translationData = zdPartialArticle;
    if (zd_type == 'categories') {
      translationData = {
        name: zdPartialArticle.title,
        description: zdPartialArticle.body
      };
    }
    if (zd_type == 'sections') {
      translationData = {
        name: zdPartialArticle.title,
      };
    }
    var o = _.extend(translationData, {
      locale: l
    });
    return {
      "translation": o
    };
  },

  txRequestJSON: function(entry, key) {
    var req = {
      name: '[' + key + '] ' + entry.title,
      slug: entry.resource_name,
      priority: 0,
      i18n_type: 'KEYVALUEJSON'
    };

    var o = {};
    var o1 = syncUtil.addString('title', entry.title, o);
    var o2 = syncUtil.addString('body', entry.body, o1);
    var o3 = syncUtil.addContent(req, o2);
    return o3;
  },

  txRequestHTML: function(entry, key) {
    var gblTemplate = common.gblTemplate;
    var zdEntryContent = _.template(gblTemplate)(entry);

    var txRequestMade = {
      name: '[' + key + '] ' + entry.title,
      slug: entry.resource_name,
      priority: 0,
      i18n_type: 'HTML',
      content: zdEntryContent
    };
    return txRequestMade;
  },

  txRequestFormat: function(entry, key) {
    if (io.getFeature('html-tx-resource')) {
      return common.txRequestHTML(entry, key);
    } else {
      return common.txRequestJSON(entry, key);
    }
  },

  addCompletedLocales: function($, name, locales) {
    var linkId = "#" + "locales-" + name;
    if (!(_.isEmpty(locales))) {
      var tpl = _.template('<span class="u-color-secondary u-fontSize-small" data-locale="<%= loc.toLowerCase() %>"><%- loc %></span>');
      $(linkId).html(_.map(locales, function(locale) {
        return tpl({loc: locale});
      }).join(', '));
    } else {
      $(linkId).text('-');
    }
  },

};

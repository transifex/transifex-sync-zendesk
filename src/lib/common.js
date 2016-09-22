var zdArticle = require('zendesk-api/article');
var txResource = require('transifex-api/resource');
var syncUtil = require('syncUtil');
var io = require('io');

var common = module.exports = {
  gblTemplate: "<html><head></head><body><h1><%= title %></h1><%= body %></body></html>",
  regExpTemplate: "<html><head></head><body><h1>(.*)</h1>(.*)</body></html>",
  translationObjectFormat: function(response, locale) {
    if (io.getFeature('html-tx-resource')) {
      return common.translationObjectHTML(response, locale);
    } else {
      return syncUtil.zdGetTranslationObject(response, locale);
    }
  },

  translationObjectHTML: function(res, l) {
    var gblTemplate = common.gblTemplate;
    var re = new RegExp(common.regExpTemplate);

    res = res.replace(new RegExp('\n', 'g'), '');
    var zdPartialArticle = {
      title: common.extractValues(res.replace(/\\"/g, '"'),
        gblTemplate).title,
      body: res.replace(/\\"/g, '"').match(re)[2],
    };
    var o = _.extend(zdPartialArticle, {
      locale: l
    });
    return {
      "translation": o
    };
  },

  txRequestJSON: function(a) {
    var req = {
      name: a.resource_name,
      slug: a.resource_name,
      priority: 0,
      i18n_type: 'KEYVALUEJSON'
    };

    var o = {};
    var o1 = syncUtil.addString('title', a.title, o);
    var o2 = syncUtil.addString('body', a.body, o1);
    var o3 = syncUtil.addContent(req, o2);
    return o4;
  },

  txRequestHTML: function(article) {
    var gblTemplate = common.gblTemplate;
    var zdArticleContent = _.template(gblTemplate)({
      title: article.title,
      name: article.name,
      body: article.body,
    });

    var txRequestMade = {
      name: article.resource_name,
      slug: article.resource_name,
      priority: 0,
      i18n_type: 'HTML',
      content: zdArticleContent
    };
    return txRequestMade;
  },

  txRequestFormat: function(article) {
    if (io.getFeature('html-tx-resource')) {
      return common.txRequestHTML(article);
    } else {
      return common.txRequestJSON(article);
    }
  },

  // Extract Values via https://github.com/laktek
  // https://github.com/laktek/extract-values

  extractValues: function(str, pattern, options) {
    options = options || {};
    var delimiters = options.delimiters || ["<%=", "%>"];
    var lowercase = options.lowercase;
    var whitespace = options.whitespace;

    var special_chars_regex = /[\\\^\$\*\+\.\?\(\)]/g;
    var token_regex = new RegExp(delimiters[0] + "([^" + delimiters.join("") +
      "\t\r\n]+)" + delimiters[1], "g");
    var tokens = pattern.match(token_regex);
    var pattern_regex = new RegExp(pattern.replace(special_chars_regex,
      "\\$&").replace(token_regex, "(\.+)"));

    if (lowercase) {
      str = str.toLowerCase();
    }

    if (whitespace) {
      str = str.replace(/\s+/g, function(match) {
        var whitespace_str = "";
        for (var i = 0; i < whitespace; i++) {
          whitespace_str = whitespace_str + match.charAt(0);
        }
        return whitespace_str;
      });
    }

    var matches = str.match(pattern_regex);

    if (!matches) {
      return null;
    }

    // Allow exact string matches to return an empty object instead of null
    if (!tokens) {
      return (str === pattern) ? {} : null;
    }

    matches = matches.splice(1);
    var output = {};
    for (var i = 0; i < tokens.length; i++) {
      output[tokens[i].replace(new RegExp(delimiters[0] + "|" + delimiters[
        1], "g"), "").trim()] = matches[i];
    }

    return output;
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

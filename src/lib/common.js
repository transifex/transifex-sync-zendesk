var zdArticle = require('zendesk-api/article');
var txResource = require('transifex-api/resource');
var syncUtil = require('syncUtil');

var common = module.exports = {
  gblTemplate: "<html><head></head><body><h1><%= title %></h1><%= body %></body></html>",
  regExpTemplate: "<html><head></head><body><h1>(.*)</h1>(.*)</body></html>",
  translationObjectFormat: function(format, response, locale) {
    if (format == 'html-tx-resource') {
      return common.translationObjectHTML(response, locale);
    } else {
      return syncUtil.zdGetTranslationObject(response, locale);
    }
  },
  /*
    txRequestFormat: function(config, article) {
      if (config.isEnabled("tx-resource-html")) {
        return txRequestHTML(article);
      } else {
        return zdArticles.getTxRequest(article);
      }
    },
  */

  translationObjectHTML: function(res, l) {
    var gblTemplate = common.gblTemplate;
    var re = new RegExp(common.regExpTemplate);

    res = res.replace(new RegExp('\n', 'g'), '');
    var zdPartialArticle = {
      name: common.extractValues(res.replace(/\\"/g, '"'),
        gblTemplate).title,
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
  createResourceName: function(zdId, zdObjectType, separator) {
    return zdObjectType.toLowerCase() + separator + zdId;
  },

  //todo - refactor me
  getTxRequest: function(a) { // articles or article
    var arr = [];
    var ret = [];
    if (a.articles instanceof Array) {
      arr = this.getIdList(a);
    } else {
      arr[0] = a.id;
    }


    for (var i = 0; i < arr.length; i++) {
      var req = {
        name: common.createResourceName(arr[i], 'articles', '-'),
        slug: common.createResourceName(arr[i], 'articles', '-'),
        priority: 0,
        i18n_type: 'KEYVALUEJSON'
      };


      var o = {};
      var o1 = syncUtil.addString('name', zdArticle.jsonHandlers.getNameArticles(
        arr[i], a), o);
      var o2 = syncUtil.addString('title', zdArticle.jsonHandlers.getTitleArticles(
        arr[i], a), o1);
      var o3 = syncUtil.addString('body', zdArticle.jsonHandlers.getBodyArticles(
        arr[i], a), o2);
      var o4 = syncUtil.addContent(req, o3);
      ret[i] = o4;
    }
    if (a.articles instanceof Array) {
      return ret;
    } else {
      return ret[0];
    }

  },
  txRequestHTML: function(article) {
    var gblTemplate = common.gblTemplate;
    var zdArticleContent = _.template(gblTemplate)({
      title: article.title,
      name: article.name,
      body: article.body,
    });

    var txRequestMade = {
      name: 'HTML-articles-' + article.id,
      slug: 'HTML-articles-' + article.id,
      priority: 0,
      i18n_type: 'HTML',
      content: zdArticleContent
    };
    return txRequestMade;
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

  activateTxLink: function($, name) {
    /*
    var linkId = "#" + "txlink-" + name;
    $(linkId).removeClass("is-disabled");
    */
  },
  addCompletedLocales: function($, name, locales) {
    var linkId = "#" + "locales-" + name;
    if (!(_.isEmpty(locales))) {
      $(linkId).text(locales.join(', '));
    } else {
      $(linkId).text('-');
    }
  },


};

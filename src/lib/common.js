var zdArticles = require('../lib/zdArticles.js');
var txResource = require('../lib/txResource.js')
var syncUtil = require('../lib/syncUtil.js')
module.exports = {

  translationObjectFormat: function(config, response, locale) {
    if (config.isEnabled("tx-resource-html")) {
      return translationObjectHTML(response, locale);
    } else {
      return syncUtil.zdGetTranslationObject(response, locale);
    }
  },

  txRequestFormat: function(config, article) {
    if (config.isEnabled("tx-resource-html")) {
      return txRequestHTML(article);
    } else {
      return zdArticles.getTxRequest(article);
    }
  },

  translationObjectHTML: function(res, l) {
    let gblTemplate =
      "<div class=\"h-zdarticle\"><h1 class=\"p-title\"><%= title %></h1><data class=\"p-name\" value=\"<%= name %>\"></data></div>";
    let r = txResource.Resource(res, gblTemplate)
    let zdPartialArticle = {
      name: Resource.getName(),
      title: Resource.getTitle(),
      body: Resource.getBody(),
    }
    var o = _.extend(zdPartialArticle, {
      locale: l
    });
    return {
      "translation": o
    };
  },

  txRequestHTML: function(article) {
    let gblTemplate =
      "<div class=\"h-zdarticle\"><h1 class=\"p-title\"><%= title %></h1><data class=\"p-name\" value=\"<%= name %>\"></data></div>";

    let zdArticleContent = zdArticles.Article(article, gblTemplate)
    let txRequestMade = {
      name: 'HTML-articles-' + article.id,
      slug: 'HTML-articles-' + article.id,
      priority: 0,
      i18n_type: 'HTML',
      content: '{' + JSON.stringify(zdArticleContent) + '}',
    }

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
    var token_regex = new RegExp(delimiters[0] + "([^" + delimiters.join("") + "\t\r\n]+)" + delimiters[1], "g");
    var tokens = pattern.match(token_regex);
    var pattern_regex = new RegExp(pattern.replace(special_chars_regex, "\\$&").replace(token_regex, "(\.+)"));

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
      output[tokens[i].replace(new RegExp(delimiters[0] + "|" + delimiters[1], "g"), "").trim()] = matches[i];
    }

    return output;
  }

};
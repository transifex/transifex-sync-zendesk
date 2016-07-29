#!/usr/bin/env node

let repl = require('repl');
let fs = require('fs');
let _ = require('underscore');
let common = require('../lib/common.js');
let envName = process.env.NODE_ENV || 'dev';
let app = {};
app.name = 'TXSYNC';
app.config = {};
app.config.delimiter = '_';
app.config.properties = {};
app.config.properties['DUMMY'] = 0;

const PATHS = {
  TX_RESOURCE_REQUEST: './test/txResourceRequest.json',
  TX_RESOURCE: './test/txResource.json',
  ZD_ARTICLE_JSON: './test/zdArticle.json',
};

let txRequest = JSON.parse(fs.readFileSync(PATHS.TX_RESOURCE_REQUEST, 'utf8'));
let gblTemplate =
"<div class=\"h-zdarticle\"><h1 class=\"p-title\"><%= title %></h1><data class=\"p-name\" value=\"<%= name %>\"></data></div>";
let txResourceResponse = JSON.parse(fs.readFileSync(PATHS.TX_RESOURCE, 'utf8'));

let Resource = (function(r, t) {
  let response = r
  let template = t
  let re = new RegExp( "<div class=\"h-zdarticle\"><h1 class=\"p-title\">(.*)</h1><data class=\"p-name\" value=\"(.*)\"></data></div>(.*)")


  // private parts
  function privateparts() {}

  return {
    getName: function() {
      return common.extractValues(response.content.replace(/\\"/g, '"'),
        template).name
    },
    getTitle: function() {
      return common.extractValues(response.content.replace(/\\"/g, '"'),
        template).title
    },
    getBody: function() {
      let zdArticleRegexString =
      "<div class=\"h-zdarticle\"><h1 class=\"p-title\">(.*)</h1><data class=\"p-name\" value=\"(.*)\"></data></div>(.*)"
      return response.content.replace(/\\"/g, '"').match(re)[3]
    },
  }
})(txResourceResponse, gblTemplate);


let zdArticleResponse = JSON.parse(fs.readFileSync(PATHS.ZD_ARTICLE_JSON,
  'utf8'));
let Article = (function(r, t) {
  let template = t
  let json = JSON.parse(fs.readFileSync(PATHS.ZD_ARTICLE_JSON, 'utf8'))

  function privateparts() {}
  return {
    getHTML: function() {
      return _.template(template)({
        title: json.title,
        name: json.name,
      }) + json.body
    },
  };
})(zdArticleResponse, gblTemplate)

let zdArticle = JSON.parse(fs.readFileSync(PATHS.ZD_ARTICLE_JSON, 'utf8'));
let zdArticleContent = Article.getHTML()
let txRequestMade = {
  name: 'HTML-articles-' + zdArticle.id,
  slug: 'HTML-articles-' + zdArticle.id,
  priority: 0,
  i18n_type: 'HTML',
  content: makeTxContent(zdArticleContent),
}

let zdArticleMade = {
  id: 205229327,
  url: "https://txtest.zendesk.com/api/v2/help_center/en-us/articles/205229327.json",
  html_url: "https://txtest.zendesk.com/hc/en-us/articles/205229327",
  author_id: 915184847,
  comments_disabled: false,
  label_names: [],
  draft: false,
  promoted: false,
  position: 0,
  vote_sum: 0,
  vote_count: 0,
  section_id: 200801117,
  created_at: "2015-04-28T20:02:47Z",
  updated_at: "2015-04-28T20:02:47Z",
  name: Resource.getName(),
  title: Resource.getTitle(),
  body: Resource.getBody(),
  source_locale: "en-us",
  locale: "en-us",
  outdated: false
}


function makeTxContent(html) {
  return '{' + JSON.stringify(html) + '}'
}

function initializeContext(context) {
  context.app = app;
  context.txRequestRaw = txRequest;
  context.txRequestMade = txRequestMade;
  context.zdArticleRaw = zdArticle;
  context.zdArticleMade = zdArticleMade
  context.zdArticleContent = zdArticleContent;
  context.Resource = Resource
  context._ = _;
}
const CLI_PARAM = '-DTXSYNC_'.toLowerCase();
let re = new RegExp(CLI_PARAM + '(.*)=(.*)', 'i');
args = process.argv
  .filter((arg) => {
    return (arg.toLowerCase().includes(CLI_PARAM));
  })
  .forEach((v, i) => {
    app.config.properties[v.match(re)[1]] = v.match(re)[2];
  });
// load properties from ENV
// load properties from file
// load properties from argsv
//
// -DTXSYNC_NEWDUMMY='something here'


var replServer = repl.start({
  prompt: envName + '>>',
});
initializeContext(replServer.context);

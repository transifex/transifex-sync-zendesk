#!/usr/bin/env node
//import TransifexApi from '../src/lib/transifex-api/transifex-api.js';

import repl from 'repl'
import fs from 'fs'


let jsdom = require('jsdom').jsdom;
let document = jsdom('<html></html>', {});
let window = document.defaultView;
let $ = require('jquery')(window);
let txApp = require('../src/app.js');
let txProject = require('../src/lib/transifex-api/project');
let txResource = require('../src/lib/transifex-api/resource');

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

//let txRequest = JSON.parse(fs.readFileSync(PATHS.TX_RESOURCE_REQUEST, 'utf8'));


function initializeContext(context) {
  context.app = app;
//  context.txapi = TransifexApi;
  context.$ = $;
  context.txApp = txApp;
  context.txProject = txProject;
  context.txResource = txResource;
}
const CLI_PARAM = '-DTXSYNC_'.toLowerCase();
let re = new RegExp(CLI_PARAM + '(.*)=(.*)', 'i');
let args = process.argv
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

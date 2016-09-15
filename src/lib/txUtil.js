/**
 * Transifex utilities
 * @module txUtil
 */

var TX_PROJECT_API_URL_REPLACE = "https://www.transifex.com/api/2/project/[PROJECT_SLUG]/",
    TX_PROJECT_API_URL_PATTERN = /(https:\/\/www.transifex.com\/api\/2\/project\/(.*)\/)/,
    TX_PROJECT_URL_PATTERN = /https:\/\/www.transifex.com\/(.*)\/(.*)\//;

function convertUrlToApi(u) {
  if (isValidUrl(u)) {
    var m = TX_PROJECT_URL_PATTERN.exec(u);
    var p = "";
    if (m && m.length) {
      p = m[2]; //TODO make this more explicit that we are mapping the url path
    }
    var r = TX_PROJECT_API_URL_REPLACE.replace("[PROJECT_SLUG]", p);
    if (isValidAPIUrl(r)) {
      return r;
    }
  }
  return false;
}

function isValidAPIUrl(u) {
  var r = TX_PROJECT_API_URL_PATTERN.test(u);
  return r;
}

function isValidUrl(u) {
  var r = TX_PROJECT_URL_PATTERN.test(u);
  return r;
}

function extractOrgFromUrl(u) {
  var response = {
    organization_slug: '',
    project_slug: ''
  };
  if (isValidUrl(u)) {
    var m = TX_PROJECT_URL_PATTERN.exec(u);
    if (m && m.length) {
      response.organization_slug = m[1];
      response.project_slug = m[2];
    }
  }
  return response;
}

module.exports = {
  extractOrgFromUrl: extractOrgFromUrl,
  convertUrlToApi: convertUrlToApi,
  isValidAPIUrl: isValidAPIUrl,
  isValidUrl: isValidUrl,
};

/**
 * Transifex utilities
 * @module txUtil
 */

 var TX_PROJECT_API_URL_PATTERN = /(http|https):\/\/(www\.transifex\.com|tx.loc:8000)\/api\/2\/project\/(.*)\//;
 var TX_PROJECT_URL_PATTERN = /(https?:\/\/)(www\.transifex\.com|tx\.loc:8000)\/(.*)\/(.*)\//;

function convertUrlToApi(u) {
  if (isValidUrl(u)) {
    var m = TX_PROJECT_URL_PATTERN.exec(u);
    if (m.length != 5) return false;
    var r = `${m[1]}${m[2]}/api/2/project/${m[4]}/`;
    if (isValidAPIUrl(r)) return r;
  }
  return false;
}

function isValidAPIUrl(u) {
  return TX_PROJECT_API_URL_PATTERN.test(u);
}

function isValidUrl(u) {
  return TX_PROJECT_URL_PATTERN.test(u);
}

function extractOrgFromUrl(u) {
  var response = {
    organization_slug: '',
    project_slug: ''
  };
  if (isValidUrl(u)) {
    var m = TX_PROJECT_URL_PATTERN.exec(u);
    if (m && m.length) {
      response.tx = m[1] + m[2];
      response.organization_slug = m[3];
      response.project_slug = m[4];
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

module.exports = {

  key: 'tx_project',
  url: '',

  resources: {
    TX_PROJECT_API_URL_REPLACE: "http://www.transifex.com/api/2/project/[PROJECT_SLUG]/",
    TX_PROJECT_API_URL_PATTERN: /(http:\/\/www.transifex.com\/api\/2\/project\/(.*)\/)/,
    TX_PROJECT_URL_PATTERN: /https:\/\/www.transifex.com\/projects\/p\/(.*)\//

  },
  convertUrlToApi: function(u) {
    if (this.checkProjectUrl(u)) {
    var m = this.resources.TX_PROJECT_URL_PATTERN.exec(u);
    var p = "";
    if (m !== null && m.length > 0){
      p=m[1];
    }
    var r = this.resources.TX_PROJECT_API_URL_REPLACE.replace("[PROJECT_SLUG]",p);
    if (this.checkProjectApiUrl(r)) {
      this.url = r; // TODO bad side-effect clean up later
      return r;
    } 
  }
    return "";
  },
  checkProjectApiUrl: function(u) {
    var r = this.resources.TX_PROJECT_API_URL_PATTERN.test(u);
    return r;

  },
  checkProjectUrl: function(u) {
    var r = this.resources.TX_PROJECT_URL_PATTERN.test(u);
    return r;

  },
  getResourceArray: function(p) {
    var result = [];
    var r = p.resources;
    if (_.isArray(r)) {
      _.each(r, function(i) {
        result.push(i.slug);
      });
    }
    return result;
  },
  getSourceLocale: function(p) {
    return p.source_language_code;
  },
  getLocales: function(p) {
    return p.teams;
  }

};
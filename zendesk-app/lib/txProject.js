module.exports = {

  key: 'tx_project',

  resources: {
    TX_PROJECT_URL_PATTERN: /(http:\/\/www.transifex.com\/api\/2\/project\/.*\/)/
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
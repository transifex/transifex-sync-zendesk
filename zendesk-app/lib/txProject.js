module.exports = {

	key: 'tx_project',

  	getResourceArray: function(p) {
  		var result = [];
    	var r = p.resources;
    	if (_.isArray(r)){
    		_.each(r, function(i) { result.push(i.slug);});
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
module.exports = {
  key: 'message_log',

  init: function() {
  	return ([new Date() +'||' + 'Initialized message log']);
  },
	//adds string s to messages m, returns new m
  add: function(s, m){
    if (_.isArray(m)) {
    	m[m.length] = new Date() +'||' + s;
    }
    return m;
  },
  getSerialized: function(m) {
  	return JSON.stringify(m);
  },
  getHtml: function(m) {
  	return JSON.stringify(m);
  }

}
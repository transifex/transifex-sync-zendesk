'use strict';

var _sayhello = require('../src/lib/sayhello.js');

(function () {

  return {
    events: {
      'app.activated': 'sayHello'
    },

    'sayHello': _sayhello.sayHello

  };
})();

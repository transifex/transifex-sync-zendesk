/**
 * Logger
 * @module logger
 */


function message() {
  return Array.prototype.join.call(arguments, ' ');
}

module.exports = {
  info: function() {
    if (typeof console !== 'undefined')
      console.log('[INFO] ' + message.apply(this, arguments));
  },
  error: function() {
    if (typeof console !== 'undefined')
      console.log('[ERROR] ' + message.apply(this, arguments));
  },
  warn: function() {
    if (typeof console !== 'undefined')
      console.log('[WARN] ' + message.apply(this, arguments));
  },
  debug: function() {
    if (typeof console !== 'undefined')
      console.log('[DEBUG] ' + message.apply(this, arguments));
  }
};

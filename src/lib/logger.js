/**
 * Logger
 * @module logger
 */

var enabled = false;

function message() {
  return Array.prototype.join.call(arguments, ' ');
}

module.exports = {
  info: function() {
    if (enabled && typeof console !== 'undefined')
      console.log('[INFO] ' + message.apply(this, arguments));
  },
  error: function() {
    if (typeof console !== 'undefined')
      (console.error || console.log)('[ERROR] ' + message.apply(this, arguments));
  },
  warn: function() {
    if (enabled && typeof console !== 'undefined')
      (console.warn || console.log)('[WARN] ' + message.apply(this, arguments));
  },
  debug: function() {
    if (enabled && typeof console !== 'undefined')
      (console.debug || console.log)('[DEBUG] ' + message.apply(this, arguments));
  }
};

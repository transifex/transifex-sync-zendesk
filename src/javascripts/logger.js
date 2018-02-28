/**
 * Logger
 * @module logger
 */

let enabled = false;

function message() {
  return Array.prototype.join.call(arguments, ' ');
}

module.exports = {
  info: () => {
     if (enabled && typeof console !== 'undefined')
       console.log('[INFO] ' + message.apply(this, arguments));
  },
  error: () => {
     if (typeof console !== 'undefined')
       console.error('[ERROR] ' + message.apply(this, arguments));
  },
  warn: () => {
     if (enabled && typeof console !== 'undefined')
       console.warn('[WARN] ' + message.apply(this, arguments));
  },
  debug: () => {
     if (enabled && typeof console !== 'undefined')
       console.debug('[DEBUG] ' + message.apply(this, arguments));
  }
};

/**
 * Sync utilities
 * @module syncUtil
 */

module.exports = {
  resources: {
    PATTERN: /[a-zA-Z0-9]+\.[a-zA-Z0-9]+\.[a-zA-Z0-9]+/,
    ZD_OBJECT_PATTERN: /(articles|sections|categories)/,
    ZD_ID_FORMAT_PATTERN: /^\d+$/,
    TX_SLUG_FORMAT_PATTERN: /^[a-zA-Z0-9_.-]*$/
  },

  addContent: function(r, c) {
    r['content'] = JSON.stringify(c);
    return r;
  },

  addString: function(k, v, c) {
    c[k] = v;
    return c;
  },

  txLocaletoZd: function(l, zd_locales) {
    var mappings = {
      en: 'en-us',
      ko_KR: 'ko',
      ja_JP: 'ja',
      bs_BA: 'ba',
      da_DK: 'da',
      el_GR: 'el',
      et_EE: 'et',
      ka_GE: 'ka',
      ms_MY: 'ms',
      sv_SE: 'sv',
      uk_UA: 'uk',
      vi_VN: 'vi',
    };
    if (mappings[l] !== undefined)
      return mappings[l];

    l = l.toLowerCase().replace('_', '-');
    if (_.contains(zd_locales, l))
      return l;

    // match de_DE like codes to de
    if (l.indexOf('-') !== -1) {
      l = l.split('-');
      if (l[0] == l[1] && _.contains(zd_locales, l[0]))
        return l[0];
    }
    return null;
  },

  zdLocaletoTx: function(l) {
    var split_locale = l.split('-');
    if (split_locale.length > 1) {
      split_locale[1] = split_locale[1].toUpperCase();
    }
    return split_locale.join('_');
  },

  isStringinArray: function(s, arr) {
    return (_.some(arr, function(i) {
      return i == s;
    }));
  },

  validTxSlugFormat: function(s) {
    var r = this.resources.TX_SLUG_FORMAT_PATTERN.test(s);
    return r;
  },

  zdGetTranslationObject: function(content, l) {
    var o = _.extend(JSON.parse(content), {
      locale: l
    });
    return {
      "translation": o
    };
  },

  zdRetriableOperation: function(promiseFunction, maxRetries, doneCallback,
    failCallback) {
    const step = 1000; // ms
    const maxDelay = 30 * step; // ms
    const cappedBackOffDelay = 9 * step; // ms
    const backoffBase = 0.2;

    let attempCount = 0;
    const pause = (duration) => new Promise(res => setTimeout(res, duration));

    const backoff = (retries) =>
      promiseFunction
      .done(data => doneCallback(data))
      .fail(xhr => {
        if (retries > 1) {
          attempCount++;
          
          let suggestedDelay = Math.min(cappedBackOffDelay,
            backoffBase * Math.pow(2, attempCount) * step);

          const min = 0;
          const max = Math.floor(suggestedDelay);
          const jitter = Math.floor(Math.random() * (max - min + 1)) + min;
          suggestedDelay = Math.floor((jitter + suggestedDelay) / 2);

          if (suggestedDelay >= maxDelay) {
            failCallback(xhr, { errorMessage: 'failed_timeout' });
          } else {
            pause(suggestedDelay).then(() => {
              backoff(retries - 1);
            });
          }
        } else {
          failCallback(xhr, { errorMessage: 'failed_all_retries' });
        }
      });
    
    backoff(maxRetries);
  }
};

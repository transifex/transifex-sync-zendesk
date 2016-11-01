var css2xpath = require('../css2xpath.js');

module.exports = function (action, type, element, done) {
    var elem = (type === 'link') ? '=' + element : element,
        method = (action === 'click') ? 'click' : 'doubleClick';

    this.browser
      .waitForVisible(css2xpath(elem), 10000)
      .click(css2xpath(elem))
      .call(done);
};

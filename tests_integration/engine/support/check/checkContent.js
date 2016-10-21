/**
 * check content for specific element or input field
 */
var css2xpath = require('../css2xpath.js');


module.exports = function (type, element, falseCase, origText, done) {
    var command = (type !== 'inputfield') ? 'getText' : 'getValue';

    // Check for empty element
    if (!done && typeof origText === 'function') {
        done = origText;
        origText = '';

        falseCase = !falseCase;
    }

    this.browser[command](css2xpath(element))
        .then(function (text) {
            if (falseCase) {
                origText.should.not.equal(text);
            } else {
                origText.should.equal(text);
            }
        })
        .call(done);
};

var css2xpath = require('../css2xpath.js');

module.exports = function (elem, falseCase, done) {
    var ms = 5000;

    falseCase = (falseCase) ? true : false;
    this.browser
        .waitForVisible(css2xpath(elem), ms, falseCase)
        .call(done);
};

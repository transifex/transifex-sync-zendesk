module.exports = function (elem, falseCase, done) {
    var ms = 5000;
    falseCase = (falseCase) ? true : false;
    elem = '=' + elem;
    this.browser
        .waitForVisible(elem, ms, falseCase)
        .call(done);
};

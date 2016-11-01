module.exports = function (filename, done) {
    this.browser
        .saveScreenshot('./' + filename + '.png')
        .call(done);
};

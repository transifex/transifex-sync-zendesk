module.exports = function (panel, done) {
    this.browser
        .execute(function(panel) {
            Transifex.live.libs.$('[data-widget="' + panel + '"] .js-txlive-widget-toggler').trigger('click');
        }, panel)
        .call(done);
};

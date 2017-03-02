/**
 * UI notifications
 * @module ui/sync-articles
 */

module.exports = {
  events: {
    'click .js-brand-dropdown [data-brand]': 'uiBrandProjectSelect',
  },
  eventHandlers: {
    uiBrandProjectSelect: function(event) {
      event.preventDefault();
      var brand = parseInt(this.$(event.target).data('brand'));
    }
  },
  actionHandlers: {

  },
};

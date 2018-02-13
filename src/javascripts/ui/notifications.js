/**
 * UI notifications
 * @module ui/sync-articles
 */
import $ from 'jquery';

module.exports = {
  actionHandlers: {
    closeNotification: e => $(e.target).parents('[data-notification]').remove(),
    notifySuccess: function(message) {
      this.notify(message, 'success');
    },
    notifyWarning: function(message) {
      this.notify(message, 'warning');
    },
    notifyError: function(message) {
      this.notify(message, 'error');
    },
    notify: function(message, type) {
      let msg = $('[data-notification="' + type + '"]').clone(false);
      // Make notification visible and mark it as removable
      msg.removeClass('u-display-none').addClass('js-notification-temp');
      msg.find('.js-notification-message').html(message);
      msg.find('.js-notification-close').click(this.closeNotification);
      msg.appendTo('.js-notifications');
    },
    notifyReset: function() {
      $('.js-notification-temp').remove();
    }
  },
};

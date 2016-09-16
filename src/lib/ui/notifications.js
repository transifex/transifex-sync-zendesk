/**
 * UI notifications
 * @module ui/sync-articles
 */

module.exports = {
  events: {
    'click .js-notification-close': 'uiNotificationsClose',
  },
  eventHandlers: {
    uiNotificationsClose: function(event) {
      if (event) event.preventDefault();
      this.$('[data-notification]').addClass('u-display-none');
    }
  },
  actionHandlers: {
    notifySuccess: function(message) {
      this.$('[data-notification="warning"], [data-notification="error"]').addClass('u-display-none');
      this.$('[data-notification="success"]').removeClass('u-display-none').
        find('.js-notification-message').text(message);
    },
    notifyWarning: function(message) {
      this.$('[data-notification="success"], [data-notification="error"]').addClass('u-display-none');
      this.$('[data-notification="warning"]').removeClass('u-display-none').
        find('.js-notification-message').text(message);
    },
    notifyError: function(message) {
      this.$('[data-notification="success"], [data-notification="warning"]').addClass('u-display-none');
      this.$('[data-notification="error"]').removeClass('u-display-none').
        find('.js-notification-message').text(message);
    },
    notifyReset: function() {
      this.uiNotificationsClose();
    }
  },
};

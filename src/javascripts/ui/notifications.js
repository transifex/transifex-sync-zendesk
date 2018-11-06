/**
 * UI notifications
 * @module ui/sync-articles
 */
import $ from 'jquery';

const logger = require('../logger')

module.exports = {
  actionHandlers: {
    closeNotification: e => $(e.target).parents('.js-notification-temp').remove(),
    notifySuccess: function(message) {
      this.notify(message, 'success');
    },
    notifyWarning: function(message) {
      this.notify(message, 'warning');
    },
    notifyError: function(message) {
      this.notify(message, 'error');
    },
    notifyInfo: function(message) {
      this.notify(message, 'info');
    },
    notify: function(message, type) {
      let msg = $('[data-notification="' + type + '"]').clone(false);
      msg.removeAttr('data-notification');
      // Make notification visible and mark it as removable
      msg.removeClass('u-display-none').addClass('js-notification-temp');
      msg.find('.js-notification-message').html(message);
      msg.find('.js-notification-close').click(this.closeNotification);
      msg.appendTo('.js-notifications');
    },
    notifyReset: function() {
      $('.js-notification-temp').remove();
    },
    queueNotification: function(message, type) {
      let messages = this.store('messages') || [];
      messages.push({
        type: type,
        message: message,
      });
      logger.info('Message queued: [' + type + '] ' + message);
      this.store('messages', messages);
    },
    displayQueuedNotifications: function() {
      let messages = this.store('messages') || [];
      _.each(messages, notification =>
        this.notify(notification['message'], notification['type'])
      );
      // Empty the messages queue
      this.store('messages', []);
    },
  },
};

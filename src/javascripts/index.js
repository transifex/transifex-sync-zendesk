/*
  console.log('Resolve handler: ', app, name);
This is the first JavaScript file that runs once your iframe is loaded within a Zendesk product.
*/
import ZAFClient from 'zendesk_app_framework_sdk';
import I18n from 'i18n';
import TxApp from './app';

let io = require('./io');

// SENTRY_INTEGRATION

// Create a new ZAFClient
var client = ZAFClient.init();

// add an event listener to detect once your app is registered with the framework
client.on('app.registered', appData => {
  client.get('currentUser.locale').then(userData => {
    // load translations based on the account's current locale
    I18n.loadTranslations(userData['currentUser.locale']);
    client.get('currentUser.email').then(userEmail => {
      io.setEmail(userEmail['currentUser.email']);
      // create a new instance of your app
      let txapp = new TxApp(client, appData);
    });
  });
});

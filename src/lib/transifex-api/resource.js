/**
 * The resource mixin is responsible for adding, retrieving and updating resources
 * from an existing project.
 * @module transifex-api/resource
 */

var txProject = require('./project'); 

module.exports = {

      txResourceStats: function(resourceName) {
        return {
          url: txProject.url + 'resource/' + resourceName + '/stats/',
          type: 'GET',
          beforeSend: function(jqxhr, settings) {
            jqxhr.resourceName = resourceName;
          },
          dataType: 'json',
          username: this.settings.tx_username,
          password: this.settings.tx_password,
          timeout: txProject.timeout,
          secure: true
        };
      },
      txResource: function(resourceName, languageCode) {
        return {
          url: txProject.url + 'resource/' + resourceName + '/translation/' + languageCode + '/',
          type: 'GET',
          beforeSend: function(jqxhr, settings) {
            jqxhr.resourceName = resourceName;
            jqxhr.languageCode = languageCode;
          },
          dataType: 'json',
          username: this.settings.tx_username,
          password: this.settings.tx_password,
          timeout: txProject.timeout,
          secure: true
        };
      },
      txInsertArticle: function(data) {
        return {
          url: txProject.url + 'resources/',
          type: 'POST',
          username: this.settings.tx_username,
          password: this.settings.tx_password,
          data: JSON.stringify(data),
          contentType: 'application/json',
          timeout: txProject.timeout,
          secure: true
        };
      },
      txUpdateArticle: function(data, resourceName) {
        return {
          url: txProject.url + 'resource/' + resourceName + '/content',
          type: 'PUT',
          username: this.settings.tx_username,
          password: this.settings.tx_password,
          data: JSON.stringify(data),
          contentType: 'application/json',
          timeout: txProject.timeout,
          secure: true
        };
      },
      txInsertSection: function(data) {
        return {
          url: txProject.url + 'resources/',
          type: 'POST',
          username: this.settings.tx_username,
          password: this.settings.tx_password,
          data: JSON.stringify(data),
          contentType: 'application/json',
          timeout: txProject.timeout,
          secure: true
        };
      },
      txUpdateSection: function(data, resourceName) {
        return {
          url: txProject.url + 'resource/' + resourceName + '/content',
          type: 'PUT',
          username: this.settings.tx_username,
          password: this.settings.tx_password,
          data: JSON.stringify(data),
          contentType: 'application/json',
          timeout: txProject.timeout,
          secure: true
        };
      },
      txInsertCategory: function(data) {
        return {
          url: txProject.url + 'resources/',
          type: 'POST',
          username: this.settings.tx_username,
          password: this.settings.tx_password,
          data: JSON.stringify(data),
          contentType: 'application/json',
          timeout: txProject.timeout,
          secure: true
        };
      },
      txUpdateCategory: function(data, resourceName) {
        return {
          url: txProject.url + 'resource/' + resourceName + '/content',
          type: 'PUT',
          username: this.settings.tx_username,
          password: this.settings.tx_password,
          data: JSON.stringify(data),
          contentType: 'application/json',
          timeout: txProject.timeout,
          secure: true
        };
      },
}

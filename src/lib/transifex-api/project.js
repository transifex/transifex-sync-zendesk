/**
 * The Transifex project API gets project data 
 * @module transifex-api/project
 */

module.exports = {
  // keep it safe, keep it secret
  // private
  key: 'tx_project',
  url: '',
  timeout: 6000,
  resources: {
    TX_PROJECT_API_URL_REPLACE: "http://www.transifex.com/api/2/project/[PROJECT_SLUG]/",
    TX_PROJECT_API_URL_PATTERN: /(http:\/\/www.transifex.com\/api\/2\/project\/(.*)\/)/,
    TX_PROJECT_URL_PATTERN: /https:\/\/www.transifex.com\/(.*)\/(.*)\//
  },

  requests: {
    txProject: function(typeString, pageString) {
      return {
        url: this.url + '?details',
        type: 'GET',
        beforeSend: function(jqxhr, settings) {
          jqxhr.page = pageString;
          jqxhr.type = typeString;
        },
        dataType: 'json',
        username: this.username,
        password: this.password,
        timeout: 3000,
        secure: false
      };
    },
  },
  events: {
    'txProject.done': 'txProjectDone',
    'txProject.fail': 'syncError'
  },
  eventHandlers: {
    txGetProjectArticles: function(page) {
      if (this.isDebug()) {
        var msg = messages.add('Get Project from Transifex', this.store(messages.key));
        this.store(messages.key, msg);
      }
      this.ajax('txProject', 'articles', page);
    },

    txGetProjectSections: function(page) {
      if (this.isDebug()) {
        var msg = messages.add('Get Project from Transifex', this.store(messages.key));
        this.store(messages.key, msg);
      }
      this.ajax('txProject', 'sections', page);
    },

    txGetProjectCategories: function(page) {
      if (this.isDebug()) {
        var msg = messages.add('Get Project from Transifex', this.store(messages.key));
        this.store(messages.key, msg);
      }
      this.ajax('txProject', 'categories', page);
    },

    txProjectDone: function(data, textStatus, jqXHR) {
      if (this.isDebug()) {
        var msg = messages.add('Transifex Project Retrieved with status:' + textStatus, this.store(messages.key));
        this.store(messages.key, msg);
      }
      this.store(txProject.key, data);
      var type = jqXHR.type;
      if (type === "articles" || type === "") {
        this.zdGetArticles(jqXHR.page);
      }
      if (type === "categories") {
        this.zdGetCategories(jqXHR.page);
      }
      if (type === "sections") {
        this.zdGetSections(jqXHR.page);
      }

    },
  }
}
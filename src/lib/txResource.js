module.exports = {

  Resource: function(r, t) {
      let response = r
      let template = t
      let re = new RegExp("<div class=\"h-zdarticle\"><h1 class=\"p-title\">(.*)</h1><data class=\"p-name\" value=\"(.*)\"></data></div>(.*)")


      // private parts
      function privateparts() {}

      return {
        getName: function() {
          return common.extractValues(response.content.replace(/\\"/g, '"'), template).name
        },
        getTitle: function() {
          return common.extractValues(response.content.replace(/\\"/g, '"'), template).title
        },
        getBody: function() {
          let zdArticleRegexString = "<div class=\"h-zdarticle\"><h1 class=\"p-title\">(.*)</h1><data class=\"p-name\" value=\"(.*)\"></data></div>(.*)"
          return response.content.replace(/\\"/g, '"').match(re)[3]
        },
      }
    } //)( txResourceResponse, gblTemplate);


};
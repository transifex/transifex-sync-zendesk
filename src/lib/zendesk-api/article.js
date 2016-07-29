/**
 * The project mixin is responsible creating, retrieving and updating TransifexApi
 * projects.
 * @module mixins/project
 */

  export function zdArticles(pageString) {
    return {
      url: '/api/v2/help_center/articles.json?per_page=7' + pageString,
      type: 'GET',
      dataType: 'json'
    };
  };
  export function zdArticlesSLTranslations() {
    return {
      url: '/api/v2/help_center/articles.json?include=translations',
      type: 'GET',
      dataType: 'json'
    };
  };
  export function zdArticleGetTranslations(articleId) {
    return {
      url: '/api/v2/help_center/articles/' + articleId + '/translations',
      type: 'GET',
      beforeSend: function(jqxhr, settings) {
        jqxhr.articleId = articleId;
      },
      contentType: 'application/json'
    };
  };
  export function zdArticleInsert(data, articleId) {
    return {
      url: '/api/v2/help_center/articles/' + articleId + '/translations.json',
      type: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json'
    };
  };
  export function zdArticleUpdate(data, id, locale) {
    return {
      url: '/api/v2/help_center/articles/' + id + '/translations/' + locale + '.json',
      type: 'PUT',
      data: JSON.stringify(data),
      contentType: 'application/json'
    };
  };

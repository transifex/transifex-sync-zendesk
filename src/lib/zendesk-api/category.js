/**
 * The project mixin is responsible creating, retrieving and updating TransifexApi
 * projects.
 * @module mixins/project
 */

export default {

      zdCategories(pageString) {
        return {
          url: '/api/v2/help_center/categories.json?per_page=7' + pageString,
          type: 'GET',
          dataType: 'json'
        };
      },
      zdCategoryGetTranslations(categoryId) {
        return {
          url: '/api/v2/help_center/categories/' + categoryId + '/translations',
          type: 'GET',
          beforeSend: function(jqxhr, settings) {
            jqxhr.categoryId = categoryId;
          },
          contentType: 'application/json'
        };
      },
      zdCategoryInsert(data, categoryId) {
        return {
          url: '/api/v2/help_center/categories/' + categoryId + '/translations.json',
          type: 'POST',
          data: JSON.stringify(data),
          contentType: 'application/json'
        };
      },
      zdCategoryUpdate(data, id, locale) {
        return {
          url: '/api/v2/help_center/categories/' + id + '/translations/' + locale + '.json',
          type: 'PUT',
          data: JSON.stringify(data),
          contentType: 'application/json'
        };
      }
}
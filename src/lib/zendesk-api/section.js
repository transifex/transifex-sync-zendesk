/**
 * The project mixin is responsible creating, retrieving and updating TransifexApi
 * projects.
 * @module mixins/project
 */

export default {
  zdSections(pageString) {
    return {
      url: '/api/v2/help_center/sections.json?per_page=7' + pageString,
      type: 'GET',
      dataType: 'json'
    };
  },
  zdSectionGetTranslations(sectionId) {
    return {
      url: '/api/v2/help_center/sections/' + sectionId + '/translations',
      type: 'GET',
      beforeSend: function(jqxhr, settings) {
        jqxhr.sectionId = sectionId;
      },
      contentType: 'application/json'
    };
  },
  zdSectionInsert(data, sectionId) {
    return {
      url: '/api/v2/help_center/sections/' + sectionId + '/translations.json',
      type: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json'
    };
  },
  zdSectionUpdate(data, id, locale) {
    return {
      url: '/api/v2/help_center/sections/' + id + '/translations/' + locale + '.json',
      type: 'PUT',
      data: JSON.stringify(data),
      contentType: 'application/json'
    };
  },
}
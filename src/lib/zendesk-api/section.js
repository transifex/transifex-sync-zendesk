/**
 * The Zendesk resource API gets section data 
 * from an existing project.
 * @module zendesk-api/sections
 */

var common = require('../common');

var section = module.exports = {
  // selfies
  key: 'zd_section',
  base_url: '/api/v2/help_center/',
  timeout: 500,
  logging: true,
  STRING_RADIX : 10,
  events: {
    'zdSections.done': 'zdSectionsDone',
    'zdSectionGetTranslations.done': 'zdSectionGetTranslationsDone',
    'zdSectionUpdate.done': 'zdSectionUpdateDone',
    'zdSectionInsert.done': 'zdSectionInsertDone',
    'zdSectionGetTranslations.fail': 'zdSectionSyncError',
    'zdSections.fail': 'zdSectionSyncError',
  },
requests: {
  zdSections: function() {
    return {
      url: section.base_url+'sections.json'+ "?per_page=7",
      type: 'GET',
      dataType: 'json'
    };
  },
  zdSectionsSLTranslations: function () {
    return {
      url: section.base_url+'/sections.json?include=translations',
      type: 'GET',
      dataType: 'json'
    };
  },
  zdSectionGetTranslations: function(id) {
    return {
      url: section.base_url+'sections/' + id + '/translations',
      type: 'GET',
      beforeSend: function(jqxhr, settings) {
        jqxhr.id = id;
      },
      contentType: 'application/json'
    };
  },
  zdSectionInsert: function(data, sectionId) {
    return {
      url: section.base_url+'sections/' + sectionId + '/translations.json',
      type: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json'
    };
  },
  zdSectionUpdate: function (data, id, locale) {
    return {
      url: section.base_url+'sections/' + id + '/translations/' + locale + '.json',
      type: 'PUT',
      data: JSON.stringify(data),
      contentType: 'application/json'
    };
  },
},
eventHandlers: {
    zdSectionsDone: function(data, textStatus) {
      if (section.logging) {
        console.log('Zendesk Sections retrieved with status:' + textStatus);
      }
      this.store(section.key, data);
      console.log('done, removing key');
      this.syncStatus = _.without(this.syncStatus,section.key);
      this.checkAsyncComplete();
    },
    zdSectionSyncError: function(jqXHR, textStatus) {
      if (section.logging) {
        console.log('Zendesk Section Retrieved with status:' + textStatus);
      }
      this.syncStatus = _.without(this.syncStatus,section.key);
      this.checkAsyncComplete();
      //this.uiErrorPageInit();
      if (jqXHR.status === 401) {
        console.log('login error');
        //this.updateMessage("txLogin", "error");
      }
    },
    zdSectionGetTranslationsDone: function(data, textStatus, jqXHR) {
      if (section.logging) {
        console.log('Zendesk Section Translations retrieved with status:' + textStatus);
      }       
      this.syncStatus = _.without(this.syncStatus,section.key+jqXHR.id);
      this.checkAsyncComplete();
    },
    zdSectionInsertDone: function(data, textStatus) {
      console.log('Transifex Resource inserted with status:' + textStatus);
    },
    zdSectionUpdateDone: function(data, textStatus) {
      console.log('Transifex Resource updated with status:' + textStatus);
    },
},
actionHandlers: {
    displaySections: function() {
        var pageData = this.store(section.key);
        pageData = [pageData];
        this.switchTo('sync_sections', {
              dataset: pageData,
            });
      },
    zdUpsertSectionTranslation: function(resource_data, section_id, zdLocale) {
      if (section.logging) {
        console.log('Upsert Section with Id:' + section_id + 'and locale:' + zdLocale);
      }

     /* var localeRegion = zdLocale.split('-');
      if (localeRegion.length > 1 && localeRegion[0] == localeRegion[1]) {
        zdLocale = localeRegion[0];
      }
      */
      var translationData;
      if (this.featureConfig('html-tx-resource')) {
      translationData = common.translationObjectFormat(this.featureConfig, resource_data, zdLocale);
      } else {
      translationData = common.translationObjectFormat(this.featureConfig, resource_data, zdLocale);
      }
      /*
      var i = _.findIndex(locales, {
        id: parseInt(section_id, 10)
      });
      */
      var translations = this.store(section.key+section_id);
      var checkLocaleExists = (typeof translations[zdLocale] === 'undefined')?false:true;
      if (checkLocaleExists) {
          this.ajax('zdSectionUpdate', translationData, section_id, zdLocale);
        } else {
          this.ajax('zdSectionInsert', translationData, section_id);
        }
    },
      asyncGetZdSections: function() {
    if (section.logging) {
        console.log('function: [asyncGetZdSections]');
      }
        this.syncStatus.push(section.key);
        var that = this;
        setTimeout(
            function() {
              that.ajax('zdSections');
            }
          , section.timeout);
    },
  asyncGetZdSectionTranslations: function(id) {
    if (section.logging) {
        console.log('function: [asyncGetZdSectionTranslation]');
      }
        this.syncStatus.push(section.key+id);
        var that = this;
        setTimeout(
            function() {
              that.ajax('zdSectionGetTranslations', id);
            }
          , section.timeout);
    },

},
jsonHandlers: {
    getSingle: function(id, a) {
    if (typeof id == 'string' || id instanceof String)
      id = parseInt(id, section.STRING_RADIX);
    var i = _.findIndex(a.sections, {
      id: id
    });
    return a.sections[i];
  },
  calcResourceName: function(obj) {
    var ret = obj.sections;
    var type = 'sections';
    if (this.featureConfig('html-tx-resource')) {
      type = 'HTML-'+type;
    }
    var typeString = type + '-';
    // Get the array key and use it as a type
    var limit = obj.sections.length;
    for (var i = 0; i < limit; i++) {
      ret[i] = _.extend(ret[i],{resource_name: typeString + ret[i].id});
  }
  return {sections:ret};
  },
    getName: function(id, a) {
    if (a.sections instanceof Array) {
      var i = _.findIndex(a.sections, {
        id: id
      });
      return a.sections[i]["name"];
    } else {
      return a.name;
    }

  },
  getTitle: function(id, a) {
    if (a.sections instanceof Array) {
      var i = _.findIndex(a.sections, {
        id: id
      });
      return a.sections[i]["title"];
    } else {
      return a.title;
    }
  },
  getBody: function(id, a) {
    if (a.sections instanceof Array) {
      var i = _.findIndex(a.sections, {
        id: id
      });
      return a.sections[i]["body"];
    } else {
      return a.body;
    }
  },
  checkPagination: function(a) {
    var i = a.page_count;
    console.log(a);
    console.log(i);
    if (typeof i === 'string') {
      i = parseInt(i,10);
    }
    if (typeof i === 'number') {
    if (i > 1) {
        return true;
      }
    }
    return false;
  },

  getPages: function(a) {
    var i = a.page_count;
    return _.range(1, i + 1);
  },
  getCurrentPage: function(a) {
    var i = a.page;
    return i;
  },
  isFewer: function(a, i) {
    if (i > 1) {
      return true;
    }
    return false;
  },
  isMore: function(a, i) {
    if (a.page_count > i) {
      return true;
    }
    return false;
  },
}
};

/**
 * Code behind for the sync-page-sections 
 * @module ui/sync-sections
 */

var zdSection = require('../zendesk-api/section');
var txProject = require('../transifex-api/project');
var txResource = require('../transifex-api/resource');
var syncUtil = require('../syncUtil');
var common = require('../common');

var syncSections = module.exports = {
  // selfies
  name: 'sync_page_sections_ui',
  key: 'sync_page_sections',
  sortby: '',
  sortdirection: '',
  perpage: '7',
  currentpage: '1', 
  logging: true,
  events: {
    'click .page_action_sections': 'uiSyncPageSectionsInit',
    'click .page_action_page': 'uiSyncPageGotoPage',
    'click .page_action_next': 'uiSyncPageNextPage',
    'click .page_action_prev': 'uiSyncPagePrevPage',
    'click .page_action_sync': 'uiSyncSections'
  },
  eventHandlers: {
    uiSyncPageSectionsInit: function() {
      if (syncSections.logging) {
        console.log('uiSyncPageSectionsInit');
      }
      var pageData = this.buildSyncPageSectionsData();
      this.switchTo('sync_page_sections', { dataset: pageData, });
      if (syncSections.sortby === 'updated_at'){
        this.$('#sortby-last-updated').addClass("disabled");
        this.$('#sortby-title').removeClass("disabled");
    }
    if (syncSections.sortby === 'title'){
        this.$('#sortby-last-updated').removeClass("disabled");
        this.$('#sortby-title').addClass("disabled");
    }
    if (syncSections.perpage === '20'){
        this.$('#perpage-ten').removeClass("disabled");
        this.$('#perpage-twenty').addClass("disabled");
    }
    if (syncSections.perpage === '10'){
        this.$('#perpage-twenty').removeClass("disabled");
        this.$('#perpage-ten').addClass("disabled");
    }

      this.loadSyncPage = this.uiSyncPageResourceStatsComplete;
      this.syncResourceStats();
      this.syncSectionTranslations();
    },
    uiSyncSections: function(event) {
      event.preventDefault();
        this.asyncGetTxProject();
        this.asyncGetZdSectionsFull(syncSections.currentpage ,syncSections.sortby, syncSections.sortdirection, syncSections.perpage);
        this.switchTo('loading_page');
        this.loadSyncPage = this.uiSyncPageSectionsInit;
    },
    uiSyncDownloadCompletedTranslations: function (event) {
      event.preventDefault();
      var linkId = "#" + event.target.id;
      var project = this.store(txProject.key);
      var sourceLocale = txProject.getSourceLocale(project);
      var txResourceName = this.$(linkId).attr("data-resource");
      var zdObjectId = this.$(linkId).attr("data-zd-object-id");
      var s = this.store(txResource.key + txResourceName);
      var completedLocales = this.completedLanguages(s);
      var zdLocale, translation;
      for (var i = 0; i < completedLocales.length; i++) { // iterate through list of locales
        if (sourceLocale !== completedLocales[i]) { // skip the source locale
          translation = this.store(txResource.key + txResourceName+completedLocales[i]);
          if (typeof translation.content === 'string') {
            zdLocale = syncUtil.txLocaletoZd(completedLocales[i]);
            this.zdUpsertSectionTranslation(translation.content, zdObjectId, zdLocale);
         }
        }
      }
    },
    uiSyncUpsertSection: function(event) {
      event.preventDefault();
      var linkId = "#" + event.target.id;
      var txResourceName = this.$(linkId).attr("data-resource");
      var zdObjectId = this.$(linkId).attr("data-zd-object-id");
      var zdObjectType = this.$(linkId).attr("data-zd-object-type");
      var sections = this.store(zdSection.key);
      var section = this.getSingle(zdObjectId, sections);
      var resource_request = {};
      if (this.featureConfig('html-tx-resource')) {
        resource_request = common.txRequestHTML(section);
      } else {
        resource_request= common.getTxRequest(section);
      }
        this.loadSyncPage = this.uiSyncUpsertSectionComplete;
        this.syncStatus.push(txResource.key+txResourceName+'upsert');
        this.txUpsertResource(resource_request, txResourceName);
    },
    uiSyncUpsertSectionComplete: function () {
      this.loadSyncPage = function(){console.log('reload TxProject');};
      this.asyncGetTxProject();
    },
    uiSyncPageResourceStatsComplete: function() {
      if (syncSections.logging) {
        console.log('uiSyncPageResourceStatsComplete');
      }
      var sectionData = this.calcResourceName(this.store(zdSection.key));
      var numSections = sectionData.sections.length;
      var resourceName, resource;
      for (var i = 0; i < numSections; i++) {
          resourceName = sectionData.sections[i].resource_name;
          resource = this.store(txResource.key+resourceName);
          var tx_completed = this.completedLanguages(resource);
          this.addCompletedLocales(resourceName,tx_completed);
          if (typeof resource !== 'number') {
            this.activateTxLink(resourceName);
            this.activateUploadButton(resourceName,false);
          } else {
            if ((typeof resource === 'number') && (resource === 404)) {
              this.activateUploadButton(resourceName,true);
            }
            if ((typeof resource === 'number') && (resource === 401)) {
              //TODO Error message on this resource
            }
          }
        }

        this.loadSyncPage = this.uiSyncPageLanguageComplete;
        this.syncCompletedLanguages();
        
    },
    uiSyncPageLanguageComplete: function() {
      if (syncSections.logging) {
        console.log('uiSyncPageLanguageComplete');
      }
      var sectionData = this.calcResourceName(this.store(zdSection.key));
      var numSections = sectionData.sections.length;

        // Local loop vars
        var numLanguages = 0;
        var resourceName = '';
        var resource = {};
        var languageArray = [];
        var resourceLanguage = {};

        for (var i = 0; i < numSections; i++) {
          resourceName = sectionData.sections[i].resource_name;
          resource = this.store(txResource.key+resourceName);
          //TODO depends on resource typeness
          if (typeof resource !== 'number') {
            languageArray = this.completedLanguages(resource);
            numLanguages = languageArray.length;
            for (var ii=0; ii< numLanguages; ii++) {
              resourceLanguage = this.store(txResource.key+resourceName+languageArray[ii]);
              if (resourceLanguage){
                this.activateDownloadButton(resourceName);
              }
            }
          }
        }

    },
    uiSyncPageGotoPage: function(event) {
    if (syncSections.logging) {
        console.log('uiSyncPageGotoPage');
      }
      var linkId = "#" + event.target.id;
      var page = this.$(linkId).attr("data-page");
      syncSections.currentpage = page;
      this.asyncGetZdSectionsFull(syncSections.currentpage ,syncSections.sortby, syncSections.sortdirection, syncSections.perpage);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiSyncPageSectionsInit;
    },
    uiSyncPageNextPage: function(event) {
      if (syncSections.logging) {
        console.log('uiSyncPageNextPage');
      }
      var linkId = "#" + event.target.id;
      var page = this.$(linkId).attr("data-current-page");
      var nextPage = parseInt(page, 10) + 1;
      syncSections.currentpage = nextPage;
      this.asyncGetZdSectionsFull(syncSections.currentpage ,syncSections.sortby, syncSections.sortdirection, syncSections.perpage);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiSyncPageSectionsInit;
    },
    uiSyncPagePrevPage: function(event) {
      if (this.isDebug()) {
        console.log('uiSyncPagePrevPage');
      }
      var linkId = "#" + event.target.id;
      var page = this.$(linkId).attr("data-current-page");
      var prevPage = parseInt(page, 10) - 1;
      syncSections.currentpage = prevPage;
      this.asyncGetZdSectionsFull(syncSections.currentpage ,syncSections.sortby, syncSections.sortdirection, syncSections.perpage);
      this.switchTo('loading_page');
      this.loadSyncPage = this.uiSyncPageSectionsInit;
    },

  },
  actionHandlers: {
      activateTxLink: function(name){
        var linkId = "#" + "txlink-" + name;
        this.$(linkId).removeClass("disabled");
      },
      addCompletedLocales: function(name,locales){
        var linkId = "#" + "locales-" + name;
        if (!(_.isEmpty(locales))){
          this.$(linkId).text(locales.toString());
        } else {
          this.$(linkId).text('None Found');
        }
      },
      activateUploadButton: function(name, isNew) {
        var linkId = "#" + "upload-" + name;
        if (isNew){
          this.$(linkId).text('Upload');
        } else {
          this.$(linkId).text('Upload');
        }
        this.$(linkId).removeClass("disabled");
        this.$(linkId).click(this.uiSyncUpsertSection.bind(this));
        this.$(linkId).css('cursor', 'pointer');
      },
      activateDownloadButton: function(name) {
        var linkId = "#" + "download-" + name;
        this.$(linkId).text('Download');
        this.$(linkId).removeClass("disabled");
        this.$(linkId).click(function(){alert('Happy day');});
        this.$(linkId).css('cursor', 'pointer');
      },
      syncSectionTranslations: function() {
        console.log('syncSectionTranslations started');
        var sectionData = this.store(zdSection.key);
        var OKToGetSectionTranslations = (typeof sectionData === 'undefined')?false:true;
        var obj, numSections;
        if (OKToGetSectionTranslations) {
          obj = this.calcResourceName(sectionData);
          numSections = obj.sections.length;
          for (var i = 0; i < numSections; i++) {
            this.asyncGetZdSectionTranslations(obj.sections[i].id);
          }
        }
      },
      syncResourceStats: function() {
        console.log('syncResourceStats started');
        var sectionData = this.store(zdSection.key);
        var OKToGetResourceStats = (typeof sectionData === 'undefined')?false:true;
        var obj, numSections;
        if (OKToGetResourceStats) {
          obj = this.calcResourceName(sectionData);
          numSections = obj.sections.length;
          for (var i = 0; i < numSections; i++) {
            this.asyncGetTxResourceStats(obj.sections[i].resource_name);
          }
        }
      },
        syncCompletedLanguages: function() {
        // Requires txProject, zdSections, and ResourceStats
        console.log('syncCompletedLanguages started');
        // Local function vars
        var sectionData = this.calcResourceName(this.store(zdSection.key));
        var numSections = sectionData.sections.length;

        // Local loop vars
        var numLanguages = 0;
        var resourceName = '';
        var resource = {};
        var languageArray = [];

        for (var i = 0; i < numSections; i++) {
          resourceName = sectionData.sections[i].resource_name;
          resource = this.store(txResource.key+resourceName);
          //TODO depends on resource typeness, fast n loose
          if (typeof resource == 'object') {
            languageArray = this.completedLanguages(resource);
            numLanguages = languageArray.length;
            for (var ii=0; ii< numLanguages; ii++) {
              // Side effect: make api calls and load resources
              this.asyncGetTxResource(resourceName, languageArray[ii]);
            }
          }
        }
      },
      buildSyncPageSectionsData: function() {
        var sectionData = this.store(zdSection.key);
        var sections = this.calcResourceName(sectionData);
        var type = 'sections';
        var limit = sections.sections.length;
        var ret = [];
        var d, e, s;
        var tx_completed, zd_object_url, tx_resource_url, zd_object_updated;
        for (var i = 0; i < limit; i++) {
          e = sections.sections[i];
          s = this.store(txResource.key + e.resource_name);
          tx_completed = this.completedLanguages(s);
          zd_object_url = "https://txtest.zendesk.com/hc/" + e.source_locale + "/" + type + "/" + e.id;
          tx_resource_url = "https://www.transifex.com/projects/p/" + txProject.name + "/" + e.resource_name;
          zd_object_updated = moment(e.updated_at).format('MMMM Do YYYY </br> h:mm:ss a');
        d = {};
        d = _.extend(d,
          {name: e.resource_name},
          {zd_object_type: type},
          {zd_object_id: e.id},
          {zd_object_url: zd_object_url},
          {zd_object_updated: zd_object_updated},
          {zd_outdated: false},
          {tx_resource_url: tx_resource_url},
          {tx_completed: tx_completed},
          {title_string: e.title}
        );
        ret.push(d);
      }
      var paginationVisible = this.checkPagination(sectionData);
      if (paginationVisible) {
        var currentPage = this.getCurrentPage(sectionData);
        syncSections.currentpage = currentPage;
        ret = _.extend(ret, {
          page_prev_enabled: this.isFewer(sectionData, currentPage),
          page_next_enabled: this.isMore(sectionData, currentPage),
          current_page: this.getCurrentPage(sectionData),
          pagination_visible: paginationVisible,
          pages: this.getPages(sectionData)
        });
      }
      return ret;
      },
  },
};
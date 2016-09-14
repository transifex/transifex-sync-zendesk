/**
 * Code behind for the sync-page-sections
 * @module ui/sync-sections
 */


var zdSection = require('../zendesk-api/section'),
    txProject = require('../transifex-api/project'),
    txResource = require('../transifex-api/resource'),
    syncUtil = require('../syncUtil'),
    logger = require('../logger'),
    io = require('../io'),
    common = require('../common');

var syncSections = module.exports = {
  // selfies
  currentpage: '1',
  events: {
    'click [tab="sections"]': 'uiSectionsTab',
    'click js-sections .js-goto-page': 'uiSectionsGotoPage',
    'click js-sections .js-goto-next': 'uiSectionsNextPage',
    'click js-sections .js-goto-prev': 'uiSectionsPrevPage',
    'click js-sections .js-sortby-title': 'uiSectionsSortByTitle',
    'click js-sections .js-sortby-updated': 'uiSectionsSortByUpdated',
    'click js-sections [perpage]': 'uiSectionsPerPage',
    'click js-sections .js-batch-upload': 'uiSectionsBatchUpload',
    'click js-sections .js-batch-download': 'uiSectionsBatchDownload',
    'click js-sections .js-refresh': 'uiSectionsSync'
  },
  eventHandlers: {
    uiSectionsTab: function(event) {
      if (event) event.preventDefault();
      syncSections.currentpage = '1';
      this.uiSectionsSync();
    },
    uiSectionsInit: function(event) {
      if (event) event.preventDefault();
      logger.debug('uiSectionsInit');

      var pageData = this.buildSyncPageSectionsData();
      this.switchTo('sync_page', {
        page: 'sections',
        page_sections: true,
        dataset: pageData,
      });

      var sorting = io.getSorting();
      if (sorting.sortby === 'updated_at') {
        this.$('#sortby-last-updated').addClass("disabled");
        this.$('#sortby-title').removeClass("disabled");
      }
      else if (sorting.sortby === 'title') {
        this.$('#sortby-last-updated').removeClass("disabled");
        this.$('#sortby-title').addClass("disabled");
      }
      this.$('[perpage]').removeClass('is-active');
      this.$('[perpage="' + sorting.perpage + '"]').addClass('is-active');

      this.loadSyncPage = this.uiSectionsResourceStatsComplete;
      this.syncResourceStatsSections();
      this.syncSectionsTranslations();
    },
    uiSectionsBatchUpload: function(event) {
      if (event) event.preventDefault();
      var sectionData = this.store(zdSection.key),
          obj = this.calcResourceNameSections(sectionData),
          numSections = obj.sections.length,
          section, resource_request, txResourceName;
      for (var i = 0; i < numSections; i++) {
        section = obj.sections[i];
        txResourceName = section.resource_name;
        resource_request = {};
        if (io.hasFeature('html-tx-resource')) {
          resource_request = common.txRequestHTML(section);
        } else {
          resource_request = common.getTxRequest(section);
        }
        this.loadSyncPage = this.uiSectionsUpsertComplete;
        io.pushSync(txResource.key + txResourceName + 'upsert');
        this.txUpsertResource(resource_request, txResourceName);
      }
    },
    uiSectionsBatchDownload: function(event) {
      if (event) event.preventDefault();
      var project = this.store(txProject.key),
          sourceLocale = txProject.getSourceLocale(project),
          sectionData = this.store(zdSection.key),
          obj = this.calcResourceNameSections(sectionData),
          numSections = obj.sections.length,
          section, resource, txResourceName, completedLocales,
          zdLocale, translation;
      for (var i = 0; i < numSections; i++) {
        section = obj.sections[i];
        txResourceName = section.resource_name;
        resource = this.store(txResource.key + txResourceName);
        completedLocales = this.completedLanguages(resource);

        for (var ii = 0; ii < completedLocales.length; ii++) { // iterate through list of locales
          if (sourceLocale !== completedLocales[ii]) { // skip the source locale
            translation = this.store(txResource.key + txResourceName + completedLocales[ii]);
            if (typeof translation.content === 'string') {
              zdLocale = syncUtil.txLocaletoZd(completedLocales[ii]);
              this.zdUpsertSectionsTranslation(translation.content, section.id, zdLocale);
            }
          }
        }
      }
    },
    uiSectionsSync: function(event) {
      if (event) event.preventDefault();
      var sorting = io.getSorting();
      this.asyncGetTxProject();
      this.asyncGetZdSectionsFull(
        syncSections.currentpage, sorting.sortby,
        sorting.sortdirection, sorting.perpage
      );
      this.switchTo('loading_page', { page_sections: true });
      this.loadSyncPage = this.uiSectionsInit;
    },
    uiSectionsDownloadCompletedTranslations: function(event) {
      if (event) event.preventDefault();
      var linkId = "#" + event.target.id,
          project = this.store(txProject.key),
          sourceLocale = txProject.getSourceLocale(project),
          txResourceName = this.$(linkId).attr("data-resource"),
          zdObjectId = this.$(linkId).attr("data-zd-object-id"),
          s = this.store(txResource.key + txResourceName),
          completedLocales = this.completedLanguages(s),
          zdLocale, translation;
      for (var i = 0; i < completedLocales.length; i++) { // iterate through list of locales
        if (sourceLocale !== completedLocales[i]) { // skip the source locale
          translation = this.store(txResource.key + txResourceName + completedLocales[i]);
          if (typeof translation.content === 'string') {
            zdLocale = syncUtil.txLocaletoZd(completedLocales[i]);
            this.zdUpsertSectionsTranslation(translation.content, zdObjectId, zdLocale);
          }
        }
      }
    },
    uiSectionsUpsert: function(event) {
      if (event) event.preventDefault();
      var linkId = "#" + event.target.id,
          txResourceName = this.$(linkId).attr("data-resource"),
          zdObjectId = this.$(linkId).attr("data-zd-object-id"),
          zdObjectType = this.$(linkId).attr("data-zd-object-type"),
          sections = this.store(zdSection.key),
          section = this.getSingleSection(zdObjectId, sections),
          resource_request = {};
      if (io.hasFeature('html-tx-resource')) {
        resource_request = common.txRequestHTML(section);
      } else {
        resource_request = common.getTxRequest(section);
      }
      this.loadSyncPage = this.uiSectionsUpsertComplete;
      io.pushSync(txResource.key + txResourceName + 'upsert');
      this.txUpsertResource(resource_request, txResourceName);
    },
    uiSectionsUpsertComplete: function() {
      logger.debug('reload TxProject');
      this.asyncGetTxProject();
    },
    uiSectionsPerPage: function(event) {
      if (event) event.preventDefault();
      var sorting = io.getSorting();
      sorting.perpage = this.$(event.target).closest('[perpage]').attr('perpage');
      io.setSorting(sorting);
      syncSections.currentpage = '1';
      this.asyncGetZdSectionsFull(
        syncSections.currentpage, sorting.sortby,
        sorting.sortdirection, sorting.perpage
      );
      this.switchTo('loading_page', { page_sections: true });
      this.loadSyncPage = this.uiSectionsInit;
    },
    uiSectionsSortByUpdated: function(event) {
      if (event) event.preventDefault();
      var sorting = io.getSorting();
      sorting.sortby = 'updated_at';
      sorting.sortdirection = 'asc';
      io.setSorting(sorting);
      syncSections.currentpage = '1';
      this.asyncGetZdSectionsFull(
        syncSections.currentpage, sorting.sortby,
        sorting.sortdirection
      );
      this.switchTo('loading_page', { page_sections: true });
      this.loadSyncPage = this.uiSectionsInit;
    },
    uiSectionsSortByTitle: function(event) {
      if (event) event.preventDefault();
      var sorting = io.getSorting();
      sorting.sortby = 'title';
      sorting.sortdirection = 'asc';
      syncSections.currentpage = '1';
      this.asyncGetZdSectionsFull(
        syncSections.currentpage, sorting.sortby,
        sorting.sortdirection
      );
      this.switchTo('loading_page', { page_sections: true });
      this.loadSyncPage = this.uiSectionsInit;
    },
    uiSectionsResourceStatsComplete: function() {
      logger.debug('uiSectionsResourceStatsComplete');
      var sectionData = this.calcResourceNameSections(this.store(zdSection.key)),
          numSections = sectionData.sections.length,
          resourceName, resource;
      for (var i = 0; i < numSections; i++) {
        resourceName = sectionData.sections[i].resource_name;
        resource = this.store(txResource.key + resourceName);
        var tx_completed = this.completedLanguages(resource);
        common.addCompletedLocales(this.$, resourceName, tx_completed);
        if (typeof resource !== 'number') {
          common.activateTxLink(this.$, resourceName);
          common.activateUploadButton(this.$, resourceName, false);
        } else {
          if ((typeof resource === 'number') && (resource === 404)) {
            common.activateUploadButton(this.$, resourceName, true);
          }
          if ((typeof resource === 'number') && (resource === 401)) {
            //TODO Error message on this resource
          }
        }
      }
      this.loadSyncPage = this.uiSectionsLanguageComplete;
      this.syncCompletedLanguagesSections();
    },
    uiSectionsLanguageComplete: function() {
      logger.debug('uiSectionsLanguageComplete');
      var sectionData = this.calcResourceNameSections(this.store(zdSection.key)),
          numSections = sectionData.sections.length,
          numLanguages = 0,
          resourceName = '',
          resource = {},
          languageArray = [],
          resourceLanguage = {};
      for (var i = 0; i < numSections; i++) {
        resourceName = sectionData.sections[i].resource_name;
        resource = this.store(txResource.key + resourceName);
        //TODO depends on resource typeness
        if (typeof resource !== 'number') {
          languageArray = this.completedLanguages(resource);
          numLanguages = languageArray.length;
          for (var ii = 0; ii < numLanguages; ii++) {
            resourceLanguage = this.store(txResource.key + resourceName + languageArray[ii]);
            if (resourceLanguage) {
              common.activateDownloadButton(this.$, resourceName);
            }
          }
        }
      }
    },
    uiSectionsGotoPage: function(event) {
      if (event) event.preventDefault();
      logger.debug('uiSectionsGotoPage');
      var linkId = "#" + event.target.id,
          page = this.$(linkId).attr("data-page"),
          sorting = io.getSorting();
      syncSections.currentpage = page;
      this.asyncGetZdSectionsFull(
        syncSections.currentpage, sorting.sortby,
        sorting.sortdirection, sorting.perpage
      );
      this.switchTo('loading_page', { page_sections: true });
      this.loadSyncPage = this.uiSectionsInit;
    },
    uiSectionsNextPage: function(event) {
      if (event) event.preventDefault();
      logger.debug('uiSectionsNextPage');
      var linkId = "#" + event.target.id,
          page = this.$(linkId).attr("data-current-page"),
          nextPage = parseInt(page, 10) + 1,
          sorting = io.getSorting();
      syncSections.currentpage = nextPage;
      this.asyncGetZdSectionsFull(
        syncSections.currentpage, sorting.sortby,
        sorting.sortdirection, sorting.perpage
      );
      this.switchTo('loading_page', { page_sections: true });
      this.loadSyncPage = this.uiSectionsInit;
    },
    uiSectionsPrevPage: function(event) {
      if (event) event.preventDefault();
      logger.debug('uiSectionsPrevPage');
      var linkId = "#" + event.target.id,
          page = this.$(linkId).attr("data-current-page"),
          prevPage = parseInt(page, 10) - 1,
          sorting = io.getSorting();
      syncSections.currentpage = prevPage;
      this.asyncGetZdSectionsFull(
        syncSections.currentpage, sorting.sortby,
        sorting.sortdirection, sorting.perpage
      );
      this.switchTo('loading_page', { page_sections: true });
      this.loadSyncPage = this.uiSectionsInit;
    },
  },
  actionHandlers: {
    syncSectionsTranslations: function() {
      logger.debug('syncSectionsTranslations started');
      var sectionData = this.store(zdSection.key),
          OKToGetSectionTranslations = (typeof sectionData === 'undefined') ? false : true,
          obj, numSections;
      if (OKToGetSectionTranslations) {
        obj = this.calcResourceNameSections(sectionData);
        numSections = obj.sections.length;
        for (var i = 0; i < numSections; i++) {
          this.asyncGetZdSectionsTranslations(obj.sections[i].id);
        }
      }
    },
    syncResourceStatsSections: function() {
      logger.debug('syncResourceStatsSections started');
      var sectionData = this.store(zdSection.key),
          OKToGetResourceStats = (typeof sectionData === 'undefined') ? false : true,
          obj, numSections;
      if (OKToGetResourceStats) {
        obj = this.calcResourceNameSections(sectionData);
        numSections = obj.sections.length;
        for (var i = 0; i < numSections; i++) {
          this.asyncGetTxResourceStats(obj.sections[i].resource_name);
        }
      }
    },
    syncCompletedLanguagesSections: function() {
      // Requires txProject, zdSections, and ResourceStats
      logger.debug('syncCompletedLanguagesSections started');
      // Local function vars
      var sectionData = this.calcResourceNameSections(this.store(zdSection.key)),
          numSections = sectionData.sections.length,
          numLanguages = 0,
          resourceName = '',
          resource = {},
          languageArray = [];
      for (var i = 0; i < numSections; i++) {
        resourceName = sectionData.sections[i].resource_name;
        resource = this.store(txResource.key + resourceName);
        //TODO depends on resource typeness, fast n loose
        if (typeof resource == 'object') {
          languageArray = this.completedLanguages(resource);
          numLanguages = languageArray.length;
          for (var ii = 0; ii < numLanguages; ii++) {
            // Side effect: make api calls and load resources
            this.asyncGetTxResource(resourceName, languageArray[ii]);
          }
        }
      }
    },
    buildSyncPageSectionsData: function() {
      var sectionData = this.store(zdSection.key),
          sections = this.calcResourceNameSections(sectionData),
          type = 'sections',
          limit = sections.sections.length,
          ret = [],
          d, e, s,
          tx_completed, zd_object_url, tx_resource_url, zd_object_updated;
      for (var i = 0; i < limit; i++) {
        e = sections.sections[i];
        s = this.store(txResource.key + e.resource_name);
        tx_completed = this.completedLanguages(s);
        zd_object_url = "https://txtest.zendesk.com/hc/" + e.source_locale +
          "/" + type + "/" + e.id;
        tx_resource_url = "https://www.transifex.com/projects/p/" +
          txProject.name + "/" + e.resource_name;
        zd_object_updated = moment(e.updated_at).format(
          'MMM D YYYY h:mma');
        d = {};
        d = _.extend(d, {
          name: e.resource_name
        }, {
          zd_object_type: type
        }, {
          zd_object_id: e.id
        }, {
          zd_object_url: zd_object_url
        }, {
          zd_object_updated: zd_object_updated
        }, {
          zd_outdated: false
        }, {
          tx_resource_url: tx_resource_url
        }, {
          tx_completed: tx_completed
        }, {
          title_string: e.title
        });
        ret.push(d);
      }
      var paginationVisible = this.checkPaginationSections(sectionData);
      if (paginationVisible) {
        var currentPage = this.getCurrentPageSections(sectionData);
        syncSections.currentpage = currentPage;
        ret = _.extend(ret, {
          page_prev_enabled: this.isFewerSections(sectionData, currentPage),
          page_next_enabled: this.isMoreSections(sectionData, currentPage),
          current_page: this.getCurrentPageSections(sectionData),
          pagination_visible: paginationVisible,
          pages: this.getPagesSections(sectionData)
        });
      }
      return ret;
    },
  },
};

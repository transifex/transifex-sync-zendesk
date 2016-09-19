/**
 * Code behind for the sync-page-*
 * @module ui/sync-factory
 */


var txProject = require('../transifex-api/project'),
    txResource = require('../transifex-api/resource'),
    syncUtil = require('../syncUtil'),
    logger = require('../logger'),
    io = require('../io'),
    common = require('../common');

// T = Articles, t = articles, api = article
module.exports = function(T, t, api) {

  function M(expression) {
    return expression.replace('<T>', T);
  }
  function m(expression) {
    return expression.replace('<t>', t);
  }

  var zdApi = require('../zendesk-api/' + api);
  var factory = {
    // selfies
    currentpage: '1',
    events: {
      'click [tab="<t>"]': M('ui<T>Tab'),
      'click .js-<t>.js-goto-page': M('ui<T>GotoPage'),
      'click .js-<t>.js-goto-next': M('ui<T>NextPage'),
      'click .js-<t>.js-goto-prev': M('ui<T>PrevPage'),
      'click .js-<t>.js-sortby-title': M('ui<T>SortByTitle'),
      'click .js-<t>.js-sortby-updated_at': M('ui<T>SortByUpdated'),
      'click .js-<t>[perpage]': M('ui<T>PerPage'),
      'click .js-<t>.js-batch-upload': M('ui<T>BatchUpload'),
      'click .js-<t>.js-batch-download': M('ui<T>BatchDownload'),
      'click .js-<t>.js-refresh': M('ui<T>Sync'),
      'click .js-<t>.js-checkbox': M('ui<T>UpdateButtons'),
      'click .js-<t>.js-select-all': M('ui<T>SelectAll'),
    },
    eventHandlers: {
      'ui<T>SelectAll': function(event) {
        if (this.processing) return;
        if (this.$(event.target).is(':checked')) {
          this.$(m('.js-<t>.js-checkbox:not(:disabled)')).prop('checked', true);
        }
        else {
          this.$(m('.js-<t>.js-checkbox')).prop('checked', false);
        }
        this[M('ui<T>UpdateButtons')](event);
      },
      'ui<T>UpdateButtons': function(event) {
        if (this.processing) return;
        var ready_for_download = this.$(m('.js-<t>.js-checkbox.js-can-download:checked')).length,
            selected = this.$(m('.js-<t>.js-checkbox:checked')),
            selected_count = selected.length,
            batch_upload = this.$(m('.js-<t>.js-batch-upload')),
            batch_download = this.$(m('.js-<t>.js-batch-download'));

        batch_upload.removeClass('has-spinner');
        batch_download.removeClass('has-spinner');
        if (selected_count) {
          batch_upload.removeAttr('disabled');
          batch_upload.removeClass('is-disabled');
          batch_upload.text('Send Resources (' + selected_count + ')');
        } else {
          batch_upload.attr('disabled');
          batch_upload.addClass('is-disabled');
          batch_upload.text('Send Resources');
        }
        if (ready_for_download) {
          batch_download.removeAttr('disabled');
          batch_download.removeClass('is-disabled');
          batch_download.text('Get Translations (' + ready_for_download + ')');
        } else {
          batch_download.attr('disabled');
          batch_download.addClass('is-disabled');
          batch_download.text('Get Translations');
        }
        //update select all
        this.$(m('.js-<t>.js-select-all')).prop(
          'checked',
          selected_count == this.$(m('.js-<t>.js-checkbox:not(:disabled)')).length
        );
      },
      'ui<T>Tab': function(event) {
        if (event) event.preventDefault();
        if (this.processing) return;
        factory.currentpage = '1';
        var sorting = io.getSorting();
        sorting.sortby = 'title';
        sorting.sortdirection = 'asc';
        io.setSorting(sorting);
        this[M('ui<T>Sync')]();
      },
      'ui<T>Init': function(event) {
        if (event) event.preventDefault();
        logger.debug(M('ui<T>Init'));

        if (io.getPageError()) {
          this.switchTo('loading_page', {
            page: t,
            page_articles: t == 'articles',
            page_categories: t == 'categories',
            page_sections: t == 'sections',
            error: true,
            login_error: io.getPageError().split(':')[1] === 'login',
            project_error: io.getPageError().split(':')[1] === 'not_found',
            transifex_error: io.getPageError().split(':')[0] === 'txProject',
            zendesk_error: io.getPageError().split(':')[0] === 'zdSync',
          });
          return;
        }

        var pageData = this[M('buildSyncPage<T>Data')]();
        this.switchTo('sync_page', {
          page: t,
          page_articles: t == 'articles',
          page_categories: t == 'categories',
          page_sections: t == 'sections',
          dataset: pageData,
        });

        var sorting = io.getSorting();
        this.$('.js-sortby-' + sorting.sortby).addClass("is-active");
        this.$('[perpage="' + sorting.perpage + '"]').addClass('is-active');
        this.$('.js-goto-page[data-page="' + factory.currentpage + '"]').addClass('is-active');

        this.loadSyncPage = this[M('ui<T>ResourceStatsComplete')];
        this[M('syncResourceStats<T>')]();
        this[M('sync<T>Translations')]();
      },
      'ui<T>BatchUpload': function(event) {
        if (event) event.preventDefault();
        if (this.processing) return;

        var object_ids = [],
            selected = this.$(m(".js-<t>.js-can-upload:checked"));
        _.each(selected, function(row){
          object_ids.push(this.$(row).attr('id'));
        });
        var data = this.store(zdApi.key),
            obj = this[M('calcResourceName<T>')](data),
            entry, resource_request, txResourceName;

        var objects = _.filter(obj[m('<t>')], function(o){
          for (var i = 0; i < object_ids.length; i++) {
            if (o.resource_name == object_ids[i])
              return true;
          }
          return false;
        });
        if (!objects.length) return;
        this[M('start<T>Process')]('upload');
        io.opResetAll();
        this.loadSyncPage = this[M('ui<T>UpsertComplete')];
        for (var i = 0; i < objects.length; i++) {
          entry = objects[i];
          txResourceName = entry.resource_name;
          resource_request = {};
          if (io.hasFeature('html-tx-resource')) {
            resource_request = common.txRequestHTML(entry);
          } else {
            resource_request = common.getTxRequest(entry);
          }
          io.pushSync(txResource.key + txResourceName + 'upsert');
          this.txUpsertResource(resource_request, txResourceName);
        }
      },
      'ui<T>BatchDownload': function(event) {
        if (event) event.preventDefault();
        if (this.processing) return;

        var object_ids = [],
            selected = this.$(m(".js-<t>.js-can-download:checked"));
        _.each(selected, function(row){
          object_ids.push(this.$(row).attr('id'));
        });
        var project = this.store(txProject.key),
            sourceLocale = txProject.jsonHandlers.getSourceLocale(project),
            data = this.store(zdApi.key),
            obj = this[M('calcResourceName<T>')](data),
            entry, resource, txResourceName, completedLocales,
            zdLocale, translation;

        var objects = _.filter(obj[m('<t>')], function(o){
          for (var i = 0; i < object_ids.length; i++) {
            if (o.resource_name == object_ids[i])
              return true;
          }
          return false;
        });
        this[M('start<T>Process')]('download');
        io.opResetAll();
        this.loadSyncPage = this[M('ui<T>DownloadComplete')];

        for (var i = 0; i < objects.length; i++) {
          entry = objects[i];
          txResourceName = entry.resource_name;
          resource = this.store(txResource.key + txResourceName);
          completedLocales = this.completedLanguages(resource);

          for (var ii = 0; ii < completedLocales.length; ii++) { // iterate through list of locales
            if (sourceLocale !== completedLocales[ii]) { // skip the source locale
              translation = this.store(txResource.key + txResourceName + completedLocales[ii]);
              if (typeof translation.content === 'string') {
                zdLocale = syncUtil.txLocaletoZd(completedLocales[ii]);
                this[M('zdUpsert<T>Translation')](translation.content, entry.id, zdLocale);
              }
            }
          }
        }
      },
      'ui<T>Sync': function(event) {
        if (event) event.preventDefault();
        if (this.processing) return;

        var sorting = io.getSorting();
        io.setPageError(null);
        this.asyncGetActivatedLocales();
        this.asyncGetTxProject();
        this[M('asyncGetZd<T>Full')](
          factory.currentpage, sorting.sortby,
          sorting.sortdirection, sorting.perpage
        );
        this.switchTo('loading_page', {
          page: t,
          page_articles: t == 'articles',
          page_categories: t == 'categories',
          page_sections: t == 'sections',
        });
        this.loadSyncPage = this[M('ui<T>Init')];
      },
      /*
      'ui<T>DownloadCompletedTranslations': function(event) {
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
              this[M('zdUpsert<T>Translation')](translation.content, zdObjectId, zdLocale);
            }
          }
        }
      },
      */
      /*
      'ui<T>Upsert': function(event) {
        if (event) event.preventDefault();
        var linkId = "#" + event.target.id,
            txResourceName = this.$(linkId).attr("data-resource"),
            zdObjectId = this.$(linkId).attr("data-zd-object-id"),
            zdObjectType = this.$(linkId).attr("data-zd-object-type"),
            entries = this.store(zdApi.key),
            entry = this[M('getSingle<T>')](zdObjectId, entries),
            resource_request = {};
        if (io.hasFeature('html-tx-resource')) {
          resource_request = common.txRequestHTML(entry);
        } else {
          resource_request = common.getTxRequest(entry);
        }
        this.loadSyncPage = this[M('ui<T>UpsertComplete')];
        io.pushSync(txResource.key + txResourceName + 'upsert');
        this.txUpsertResource(resource_request, txResourceName);
      },
      */
      'ui<T>UpsertComplete': function() {
        logger.debug('Upsert complete');
        this[M('end<T>Process')]();
        var total = 0, failed = 0;
        _.each(io.opGetAll(), function(status, resourceName) {
          total++;
          var el = this.$(m('.js-<t>[data-resource="' + resourceName + '"] [data-item="controller"]'));
          el.addClass('o-status').removeClass('o-interactive-list__item');
          if (status == 'success') {
            el.addClass('is-success');
          }
          else {
            failed++;
            el.addClass('is-error');
          }
        }, this);
        if (failed == 1) {
          this.notifyError('1 resource could not be uploaded to Transifex');
        }
        else if (failed) {
          this.notifyError(failed + ' resources could not be uploaded to Transifex');
        }
        else {
          this.notifySuccess('You have successfully sent your resources!');
        }
      },
      'ui<T>DownloadComplete': function() {
        logger.debug('Download complete');
        this[M('end<T>Process')]();
        var total = 0, failed = 0;
        _.each(io.opGetAll(), function(status, opName) {
          total++;
          var resourceName = 'HTML-' + m('<t>') + '-' + opName.split('_')[0];
          var resourceLoc  = opName.split('_')[1];

          console.log(resourceName)
          console.log(resourceLoc)
          var el = this.$(m('.js-<t>[data-resource="' + resourceName + '"] [data-locale="' + resourceLoc + '"]'));
          //el.addClass('o-status').removeClass('o-interactive-list__item');
          if (status == 'success') {
            el.addClass('is-success');
          }
          else {
            failed++;
            el.addClass('is-error');
          }
        }, this);
        if (failed == 1) {
          this.notifyError('1 resource could not be downloaded from Transifex');
        }
        else if (failed) {
          this.notifyError(failed + ' resources could not be downloaded from Transifex');
        }
        else {
          this.notifySuccess('You have successfully downloaded your resources!');
        }
      },
      'ui<T>PerPage': function(event) {
        if (event) event.preventDefault();
        if (this.processing) return;
        var sorting = io.getSorting();
        sorting.perpage = this.$(event.target).closest('[perpage]').attr('perpage');
        io.setSorting(sorting);
        factory.currentpage = '1';
        this[M('asyncGetZd<T>Full')](
          factory.currentpage, sorting.sortby,
          sorting.sortdirection, sorting.perpage
        );
        this.switchTo('loading_page', {
          page: t,
          page_articles: t == 'articles',
          page_categories: t == 'categories',
          page_sections: t == 'sections',
        });
        this.loadSyncPage = this[M('ui<T>Init')];
      },
      'ui<T>SortByUpdated': function(event) {
        if (event) event.preventDefault();
        if (this.processing) return;

        var sorting = io.getSorting();
        if (sorting.sortby == 'updated_at') return;
        sorting.sortby = 'updated_at';
        sorting.sortdirection = 'desc';
        io.setSorting(sorting);
        factory.currentpage = '1';
        this[M('asyncGetZd<T>Full')](
          factory.currentpage, sorting.sortby,
          sorting.sortdirection, sorting.perpage
        );
        this.switchTo('loading_page', {
          page: t,
          page_articles: t == 'articles',
          page_categories: t == 'categories',
          page_sections: t == 'sections',
        });
        this.loadSyncPage = this[M('ui<T>Init')];
      },
      'ui<T>SortByTitle': function(event) {
        if (event) event.preventDefault();
        if (this.processing) return;

        var sorting = io.getSorting();
        if (sorting.sortby == 'title') return;
        sorting.sortby = 'title';
        sorting.sortdirection = 'asc';
        factory.currentpage = '1';
        this[M('asyncGetZd<T>Full')](
          factory.currentpage, sorting.sortby,
          sorting.sortdirection, sorting.perpage
        );
        this.switchTo('loading_page', {
          page: t,
          page_articles: t == 'articles',
          page_categories: t == 'categories',
          page_sections: t == 'sections',
        });
        this.loadSyncPage = this[M('ui<T>Init')];
      },
      'ui<T>ResourceStatsComplete': function() {
        logger.debug(M('ui<T>ResourceStatsComplete'));
        var data = this[M('calcResourceName<T>')](this.store(zdApi.key)),
            num = data[t].length,
            resourceName, resource, has_error = false,
            projectData = this.store('tx_project'),
            projectResources = [];

        if (projectData && projectData.resources) {
          projectResources = _.map(projectData.resources, function(entry) {
            return entry.slug;
          });
        }
        for (var i = 0; i < num; i++) {
          resourceName = data[t][i].resource_name;
          resource = this.store(txResource.key + resourceName);
          var tx_completed = this.completedLanguages(resource);
          common.addCompletedLocales(this.$, resourceName, tx_completed);

          var el_item = this.$(m('.js-<t>[data-resource="' + resourceName + '"]'));
          el_item.find('[data-status]').addClass('is-hidden');
          el_item.find('[data-item="controller"]').
            addClass('o-interactive-list__item').
            removeClass('o-status is-warning');

          //not uploaded resource
          if (typeof resource === 'number' && !_.contains(projectResources, resourceName)) {
            this.$('#' + resourceName).prop('disabled', false).addClass('js-can-upload');
            el_item.find('[data-status="not_found"]').removeClass('is-hidden');
          }
          //normal
          else if (typeof resource !== 'number') {
            this.$('#' + resourceName).prop('disabled', false).addClass('js-can-upload');
            el_item.find('[data-status="found"]').removeClass('is-hidden');
          }
          else {
            has_error = true;
            el_item.find('[data-status="error"]').removeClass('is-hidden');
            el_item.find('[data-item="controller"]').
              removeClass('o-interactive-list__item').
              addClass('o-status is-warning js-perma-fail');
          }
        }
        if (has_error) {
          this.notifyWarning('Some Transifex resources could not be loaded, you can click the refresh link to retry.');
        }
        this.$(m('.js-<t>.js-select-all')).prop('disabled', false);
        this.loadSyncPage = this[M('ui<T>LanguageComplete')];
        this[M('syncCompletedLanguages<T>')]();
      },
      'ui<T>LanguageComplete': function() {
        logger.debug(M('ui<T>LanguageComplete'));
        var data = this[M('calcResourceName<T>')](this.store(zdApi.key)),
            num = data[t].length,
            numLanguages = 0,
            resourceName = '',
            resource = {},
            languageArray = [],
            resourceLanguage = {};
        for (var i = 0; i < num; i++) {
          resourceName = data[t][i].resource_name;
          resource = this.store(txResource.key + resourceName);
          //TODO depends on resource typeness
          if (typeof resource !== 'number') {
            languageArray = this.completedLanguages(resource);
            numLanguages = languageArray.length;
            for (var ii = 0; ii < numLanguages; ii++) {
              resourceLanguage = this.store(txResource.key + resourceName + languageArray[ii]);
              if (resourceLanguage) {
                this.$('#' + resourceName).addClass('js-can-download');
              }
            }
          }
        }
      },
      'ui<T>GotoPage': function(event) {
        if (event) event.preventDefault();
        if (this.processing) return;

        logger.debug(M('ui<T>GotoPage'));
        var page = this.$(event.target).attr("data-page"),
            sorting = io.getSorting();
        factory.currentpage = page;
        this[M('asyncGetZd<T>Full')](
          factory.currentpage, sorting.sortby,
          sorting.sortdirection, sorting.perpage
        );
        this.switchTo('loading_page', {
          page: t,
          page_articles: t == 'articles',
          page_categories: t == 'categories',
          page_sections: t == 'sections',
        });
        this.loadSyncPage = this[M('ui<T>Init')];
      },
      'ui<T>NextPage': function(event) {
        if (event) event.preventDefault();
        if (this.processing) return;

        logger.debug(M('ui<T>NextPage'));
        var page = this.$(event.target).attr("data-current-page"),
            nextPage = parseInt(page, 10) + 1,
            sorting = io.getSorting();
        factory.currentpage = nextPage;
        this[M('asyncGetZd<T>Full')](
          factory.currentpage, sorting.sortby,
          sorting.sortdirection, sorting.perpage
        );
        this.switchTo('loading_page', {
          page: t,
          page_articles: t == 'articles',
          page_categories: t == 'categories',
          page_sections: t == 'sections',
        });
        this.loadSyncPage = this[M('ui<T>Init')];
      },
      'ui<T>PrevPage': function(event) {
        if (event) event.preventDefault();
        if (this.processing) return;

        logger.debug(M('ui<T>PrevPage'));
        var page = this.$(event.target).attr("data-current-page"),
            prevPage = parseInt(page, 10) - 1,
            sorting = io.getSorting();
        factory.currentpage = prevPage;
        this[M('asyncGetZd<T>Full')](
          factory.currentpage, sorting.sortby,
          sorting.sortdirection, sorting.perpage
        );
        this.switchTo('loading_page', {
          page: t,
          page_articles: t == 'articles',
          page_categories: t == 'categories',
          page_sections: t == 'sections',
        });
        this.loadSyncPage = this[M('ui<T>Init')];
      },
    },
    actionHandlers: {
      'start<T>Process': function(action) {
        this.processing = true;
        this.notifyReset();
        this.$(m('.js-<t>.js-refresh')).addClass('is-disabled');
        this.$(m('.js-<t>.js-batch-upload')).addClass('is-disabled');
        this.$(m('.js-<t>.js-batch-download')).addClass('is-disabled');
        this.$(m('.js-<t>.js-checkbox')).prop('disabled', true);
        this.$(m('.js-<t>.js-select-all')).prop('disabled', true);
        var $ = this.$;
        this.$(m('.js-<t>[data-resource]')).each(function() {
          $(this).find('[data-item="controller"]:not(.js-perma-fail)').
            removeClass('o-status is-success is-error is-warning').
            addClass('o-interactive-list__item');
        });
        if (action == 'upload') {
          this.$(m('.js-<t>.js-batch-upload')).
            addClass('has-spinner').
            html('<span class="o-spinner o-button__spinner"></span>');
        }
        else if (action == 'download') {
          this.$(m('.js-<t>.js-batch-download')).
            addClass('has-spinner').
            html('<span class="o-spinner o-button__spinner"></span>');
        }
      },
      'end<T>Process': function() {
        this.processing = false;
        this.$(m('.js-<t>.js-refresh')).removeClass('is-disabled');
        this.$(m('.js-<t>.js-checkbox')).prop('checked', false);
        this.$(m('.js-<t>.js-checkbox.js-can-upload')).prop('disabled', false);
        this.$(m('.js-<t>.js-checkbox.js-can-download')).prop('disabled', false);
        this.$(m('.js-<t>.js-select-all')).prop('disabled', false).
          prop('checked', false);
        this[M('ui<T>UpdateButtons')]();
      },
      'sync<T>Translations': function() {
        logger.debug(M('sync<T>Translations started'));
        var data = this.store(zdApi.key),
            OKToGetTranslations = (typeof data === 'undefined') ? false : true,
            obj, num;
        if (OKToGetTranslations) {
          obj = this[M('calcResourceName<T>')](data);
          num = obj[t].length;
          for (var i = 0; i < num; i++) {
            this[M('asyncGetZd<T>Translations')](obj[t][i].id);
          }
        }
      },
      'syncResourceStats<T>': function() {
        logger.debug(M('syncResourceStats<T> started'));
        var data = this.store(zdApi.key),
            OKToGetResourceStats = (typeof data === 'undefined') ? false : true,
            obj, num;
        if (OKToGetResourceStats) {
          obj = this[M('calcResourceName<T>')](data);
          num = obj[t].length;
          for (var i = 0; i < num; i++) {
            this.asyncGetTxResourceStats(obj[t][i].resource_name);
          }
        }
      },
      'syncCompletedLanguages<T>': function() {
        // Requires txProject, zdApis, and ResourceStats
        logger.debug(M('syncCompletedLanguages<T> started'));
        // Local function vars
        var data = this[M('calcResourceName<T>')](this.store(zdApi.key)),
            num = data[t].length,
            numLanguages = 0,
            resourceName = '',
            resource = {},
            languageArray = [];
        for (var i = 0; i < num; i++) {
          resourceName = data[t][i].resource_name;
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
      'buildSyncPage<T>Data': function() {
        var data = this.store(zdApi.key),
            entries = this[M('calcResourceName<T>')](data),
            type = t,
            limit = entries[t].length,
            ret = [],
            d, e, s,
            tx_completed, zd_object_url, tx_resource_url, zd_object_updated;
        for (var i = 0; i < limit; i++) {
          e = entries[t][i];
          s = this.store(txResource.key + e.resource_name);
          tx_completed = this.completedLanguages(s);
          zd_object_url = "https://txtest.zendesk.com/hc/" + e.source_locale +
            "/" + type + "/" + e.id;
          tx_resource_url = txProject.dashboard_url.replace(/\/$/, '') + '/' + e.resource_name;
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
        var paginationVisible = this[M('checkPagination<T>')](data);
        if (paginationVisible) {
          var currentPage = this[M('getCurrentPage<T>')](data);
          factory.currentpage = currentPage;
          ret = _.extend(ret, {
            page_prev_enabled: this[M('isFewer<T>')](data, currentPage),
            page_next_enabled: this[M('isMore<T>')](data, currentPage),
            current_page: this[M('getCurrentPage<T>')](data),
            pagination_visible: paginationVisible,
            pages: this[M('getPages<T>')](data)
          });
        }
        return ret;
      }
    }
  };

  _.each(['events', 'eventHandlers', 'actionHandlers'], function(entry) {
    var object = factory[entry];
    _.each(object, function(value, key) {
      delete object[key];
      object[M(m(key))] = value;
    });
  });

  return factory;
};

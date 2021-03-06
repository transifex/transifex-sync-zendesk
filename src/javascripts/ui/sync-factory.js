/**
 * Code behind for the sync-page-*
 * @module ui/sync-factory
 */

import $ from 'jquery';

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
      'pane.activated': 'uiSync',
      'click [tab="<t>"]': M('ui<T>Tab'),
      'click .js-<t>.js-goto-page': M('ui<T>GotoPage'),
      'click .js-<t>.js-sortby-title': M('ui<T>SortByTitle'),
      'click .js-<t>.js-sortby-updated_at': M('ui<T>SortByUpdated'),
      'click .js-<t>[perpage]': M('ui<T>PerPage'),
      'click .js-<t>.js-batch-upload': M('ui<T>BatchUpload'),
      'click .js-<t>.js-batch-download': M('ui<T>BatchDownload'),
      'click .js-<t>.js-refresh': M('ui<T>Sync'),
      'click .js-<t>.js-checkbox': M('ui<T>UpdateButtons'),
      'click .js-<t>.js-select-all': M('ui<T>SelectAll'),
      'keyup .js-<t>.js-search': M('ui<T>Search'),
      'click .js-<t>.js-clear-search': M('ui<T>Tab'),
      'click .js-<t>-brand [data-brand]': M('ui<T>BrandTab'),
      'click .js-<t>-add-brand': M('ui<T>AddNewBrandToTX'),
    },
    eventHandlers: {
      'ui<T>Search': function(event) {
        if (this.processing) return;
        var code = event.which || event.keyCode;
        var search_query = $(m('.js-<t>.js-search :input')).val();
        if(search_query !== '') {
          $('.js-clear-search').removeClass("u-display-none");
        }
        else if (io.getQuery() === ''){
          $('.js-clear-search').addClass("u-display-none");
        }
        if (code == 13){
          event.preventDefault();
          if(search_query == io.getQuery() || search_query === '') return;
          if(io.getQuery !== search_query){
            factory.currentpage = '1';
          }
          var sorting = io.getSorting();
          io.setQuery(search_query);
          this[M('asyncGetZd<T>Full')](
            factory.currentpage, sorting.sortby,
            sorting.sortdirection, sorting.perpage, search_query
          );
          this.switchTo('loading_page', {
            page: t,
            page_articles: t == 'articles',
            page_categories: t == 'categories',
            page_sections: t == 'sections',
            page_dynamic_content: t == 'dynamic',
            search_term: search_query
          });
          this.loadSyncPage = this[M('ui<T>Init')];
        }
      },

      'uiLoadConf': function(event) {
        if (event) event.preventDefault();
        if (this.processing) return;
        this.loadSyncPage = this.uiArticlesTab;
        this.zdGetBrands();
        this.asyncGetActivatedLocales();
        this.asyncGetCurrentLocale();
        this.asyncGetTxProject();
      },
      'ui<T>SelectAll': function(event) {
        if (this.processing) return;
        if ($(event.target).is(':checked')) {
          $(m('.js-<t>.js-checkbox:not(:disabled)')).prop('checked', true);
        }
        else {
          $(m('.js-<t>.js-checkbox')).prop('checked', false);
        }
        this[M('ui<T>UpdateButtons')](event);
      },
      'ui<T>UpdateButtons': function(event) {
        if (this.processing) return;
        var ready_for_download = $(m('.js-<t>.js-checkbox.js-can-download:checked')).length,
            selected = $(m('.js-<t>.js-checkbox:checked')),
            selected_count = selected.length,
            batch_upload = $(m('.js-<t>.js-batch-upload')),
            batch_download = $(m('.js-<t>.js-batch-download'));

        batch_upload.removeClass('has-spinner');
        batch_download.removeClass('has-spinner');
        if (selected_count) {
          batch_upload.removeAttr('disabled');
          batch_upload.removeClass('is-disabled');
          batch_upload.text(this.original_upload_text + ' (' + selected_count + ')');
        } else {
          batch_upload.attr('disabled');
          batch_upload.addClass('is-disabled');
          batch_upload.text(this.original_upload_text);
        }
        if (ready_for_download) {
          batch_download.removeAttr('disabled');
          batch_download.removeClass('is-disabled');
          batch_download.text('Get Translations' + ' (' + ready_for_download + ')');
        } else {
          batch_download.attr('disabled');
          batch_download.addClass('is-disabled');
          batch_download.text('Get Translations');
        }
        //update select all
        $(m('.js-<t>.js-select-all')).prop(
          'checked',
          selected_count == $(m('.js-<t>.js-checkbox:not(:disabled)')).length
        );
      },
      'ui<T>Tab': function(event) {
        var default_locale, project_locale;
        if (event) event.preventDefault();
        if (this.processing) return;
        sessionStorage.setItem('TxActiveTab', T);
        io.setQuery('');
        if (!io.getPageError()) {
          default_locale = this.store('default_locale').split('-')[0];
          project_locale = this.store(txProject.key).source_language_code.split('_')[0];
          if (project_locale !== default_locale){
            io.setPageError('txProject:locale');
          }
        }
        if (io.getPageError()) {
          this.switchTo('loading_page', {
            page: t,
            page_articles: t == 'articles',
            page_categories: t == 'categories',
            page_sections: t == 'sections',
            page_dynamic_content: t == 'dynamic',
            error: true,
            login_error: io.getPageError().split(':')[1] === 'login',
            perm_error: io.getPageError().split(':')[1] === 'permission',
            locale_error: io.getPageError().split(':')[1] === 'locale',
            project_error: io.getPageError().split(':')[1] === 'not_found',
            transifex_error: io.getPageError().split(':')[0] === 'txProject',
            zendesk_error: io.getPageError().split(':')[0] === 'zdSync',
          });
          return;
        }
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

        var search_query = io.getQuery();
        var pageData = this[M('buildSyncPage<T>Data')]();
        var brandsData = this.buildBrandsData();
        var default_brand = _.find(brandsData.brands, {default: true});
        this.switchTo('sync_page', {
          project_name: this.selected_brand.name,
          is_default_brand: this.selected_brand.default,
          default_brand_name: default_brand.name,
          page: t,
          page_articles: t == 'articles',
          page_categories: t == 'categories',
          page_sections: t == 'sections',
          page_dynamic_content: t == 'dynamic',
          dataset: pageData,
          brands: brandsData.brands,
          has_more_brands: brandsData.has_more,
          search_term: search_query,
          has_zd_key: this.settings.zd_api_key && this.settings.zd_api_key.length > 0,
        });

        var sorting = io.getSorting();
        $('.js-sortby-' + sorting.sortby).addClass("is-active");
        $('[perpage="' + sorting.perpage + '"]').addClass('is-active');
        $('.js-goto-page[data-page="' + factory.currentpage + '"]').addClass('is-active');

        this.original_upload_text = $(m('.js-<t>.js-batch-upload')).text();
        this.loadSyncPage = this[M('ui<T>ResourceStatsComplete')];
        this[M('syncResourceStats<T>')]();
        this[M('sync<T>Translations')]();
        $('[data-toggle="tooltip"]').tooltip({
          container: 'body',
        });

        this.displayQueuedNotifications();
      },
      'ui<T>BatchUpload': function(event) {
        if (event) event.preventDefault();
        if (this.processing || $(event.target).hasClass('is-disabled')) return;

        var object_ids = [],
            selected = $(m(".js-<t>.js-can-upload:checked"));
        _.each(selected, function(row){
          object_ids.push($(row).attr('id'));
        });
        var data = this.store(zdApi.key),
            obj = this[M('calcResourceName<T>')](data),
            entry, resource_request, txResourceName, category;

        if (api == 'dynamic-content')
          category = 'Dynamic';
        else
          category = api[0].toUpperCase() + api.slice(1);

        var objects = _.filter(obj[m('<t>')], function(o){
          return object_ids.indexOf(o.resource_name) !== -1;
        });
        if (!objects.length) return;
        this[M('start<T>Process')]('upload');
        io.opResetAll();
        this.loadSyncPage = this[M('ui<T>UpsertComplete')];
        this.txUpsertBatchResources(this[M('get<T>ForTranslation')], category, objects);
      },
      'ui<T>BatchDownload': function(event) {
        if (event) event.preventDefault();
        if (this.processing || $(event.target).hasClass('is-disabled')) return;

        var object_ids = [],
            selected = $(m(".js-<t>.js-can-download:checked"));
        _.each(selected, function(row){
          object_ids.push($(row).attr('id'));
        });
        var project = this.store(txProject.key),
            data = this.store(zdApi.key),
            obj = this[M('calcResourceName<T>')](data),
            entry, resource, txResourceName, completedLocales;

        var objects = _.filter(obj[m('<t>')], function(o){
          return object_ids.indexOf(o.resource_name) !== -1;
        });
        this[M('start<T>Process')]('download');
        io.opResetAll();
        this.loadSyncPage = this[M('ui<T>DownloadComplete')];
        this.zdUpsertBatchTranslations(objects);
      },
      'uiSync': function() {
        if (this.processing) return;

        var page = sessionStorage.getItem('TxActiveTab') || 'Articles';
        this['ui' + page + 'Sync']();
      },
      'ui<T>Sync': function(event) {
        if (event) event.preventDefault();
        if (this.processing) return;

        var sorting = io.getSorting();
        io.setQuery('');
        io.setPageError(null);
        this[M('asyncGetZd<T>Full')](
          factory.currentpage, sorting.sortby,
          sorting.sortdirection, sorting.perpage
        );
        this.switchTo('loading_page', {
          page: t,
          page_articles: t == 'articles',
          page_categories: t == 'categories',
          page_sections: t == 'sections',
          page_dynamic_content: t == 'dynamic',
        });
        this.loadSyncPage = this[M('ui<T>Init')];
      },
      'ui<T>UpsertComplete': function() {
        logger.debug('Upsert complete');
        this[M('end<T>Process')]();
        var total = 0, failed = 0;
        _.each(io.opGetAll(), function(status, resourceName) {
          total++;
          var el = $(m('.js-<t>[data-resource="' + resourceName + '"] [data-item="controller"]'));
          var is_new = !(el.find('[data-status="not_found"]').hasClass('is-hidden'));
          el.addClass('o-status').removeClass('o-interactive-list__item');
          if (status == 'success') {
            el.addClass('is-success');
            el.find('[data-status="not_found"]').addClass('is-hidden');
            el.find('[data-status="found"]').removeClass('is-hidden');
            if (is_new)
              el.find('[data-status="in_translation"]').removeClass('is-hidden');
          }
          else {
            failed++;
          }
        }, this);
        var content_type = t == 'dynamic' ? 'dynamic content items' : m('<t>');
        if (failed === 0) {
          this.notifySuccess(total + ' ' + content_type + '  were successfully uploaded to Transifex.');
        } else if (failed == total) {
          this.notifyError('None of the selected ' + content_type + ' could be uploaded to Transifex.');
          $('[data-resource] .o-status[data-item="controller"]:not(.is-success)').addClass('is-error');
        } else {
          this.notifyWarning((total - failed) + ' ' + content_type + ' were successfully uploaded to Transifex, ' + failed + ' ' + api + ' could not be uploaded.');
          $('[data-resource] .o-status[data-item="controller"]:not(.is-success)').addClass('is-warning');
        }

        // Display any possible information about resource renaming
        let renames = io.getRenames();
        if (renames['done'] > 0) {
          this.notifySuccess(renames['done'] + ' resources renamed in Transifex');
        }
        if (renames['fail'] > 0) {
          this.notifyWarning(renames['fail'] + ' resources failed to be renamed in Transifex');
        }
        io.clearRenames();
      },
      'ui<T>DownloadComplete': function() {
        var that = this;
        logger.debug('Download complete');
        this.notifyReset();
        this[M('end<T>Process')]();
        var resource_prefix = io.getFeature('html-tx-resource') ? 'HTML-' : '';
        var total = 0, failed = 0;

        _.each(io.opGetAll(), function(status, opName) {
          total++;
          var resourceName = m('<t>') + '-' + opName.split('_')[0];
          var resourceLoc  = opName.split('_')[1].toLowerCase().replace('-','_');
          var el = $(m('#locales-' + resource_prefix + resourceName)).find('[data-locale="' + resourceLoc + '"]');
          if (status !== 'success') {
            failed++;
            el.removeClass('u-color-secondary').addClass('o-status__text');
          } else {
            el.addClass('js-locale-ok');
          }
        }, this);

        var content_type = t == 'dynamic' ? 'dynamic content items' : m('<t>');
        if (failed === 0) {
          this.notifySuccess('Translations were successfully updated in ' + total + ' languages for all selected ' + content_type + '.');
        } else if (failed == total) {
          this.notifyError('Translations could not be updated for any of the selected ' + content_type + '.');
        } else {
          if (failed == 1) {
            this.notifyWarning('Translations were successfully updated for ' + (total - failed) + ' languages of the selected ' + content_type + ', 1 language could not be updated.');
          } else {
            this.notifyWarning('Translations were successfully updated for ' + (total - failed) + ' languages of the selected ' + content_type + ', ' + failed + ' languages could not be updated.');
          }
        }

        $(m('.js-<t>[data-resource]')).each(function() {
          var el = $(this);
          if (el.find('.js-locale-ok').length) {
            el.find('.js-locale-ok').removeClass('js-locale-ok');
            el.addClass('o-status').removeClass('o-interactive-list__item');
            el.addClass('is-success');
          }

          if (el.find('[data-locale].o-status__text').length) {
            el.addClass('o-status').removeClass('o-interactive-list__item');
            if (failed == total) {
              el.addClass('is-error');
            } else {
              el.addClass('is-warning');
            }
          }
        });

      },
      'ui<T>PerPage': function(event) {
        if (event) event.preventDefault();
        if (this.processing) return;
        var sorting = io.getSorting(),
            query = io.getQuery();
        sorting.perpage = $(event.target).closest('[perpage]').attr('perpage');
        io.setSorting(sorting);
        factory.currentpage = '1';
        this[M('asyncGetZd<T>Full')](
          factory.currentpage, sorting.sortby,
          sorting.sortdirection, sorting.perpage, query
        );
        this.switchTo('loading_page', {
          page: t,
          page_articles: t == 'articles',
          page_categories: t == 'categories',
          page_sections: t == 'sections',
          page_dynamic_content: t == 'dynamic',
          query_term: query,
        });
        this.loadSyncPage = this[M('ui<T>Init')];
      },
      'ui<T>SortByUpdated': function(event) {
        if (event) event.preventDefault();
        if (this.processing) return;

        var sorting = io.getSorting(),
            query = io.getQuery();
        if (sorting.sortby == 'updated_at') return;
        sorting.sortby = 'updated_at';
        sorting.sortdirection = 'desc';
        io.setSorting(sorting);
        factory.currentpage = '1';
        this[M('asyncGetZd<T>Full')](
          factory.currentpage, sorting.sortby,
          sorting.sortdirection, sorting.perpage, query
        );
        this.switchTo('loading_page', {
          page: t,
          page_articles: t == 'articles',
          page_categories: t == 'categories',
          page_sections: t == 'sections',
          page_dynamic_content: t == 'dynamic',
          query_term: query,
        });
        this.loadSyncPage = this[M('ui<T>Init')];
      },
      'ui<T>SortByTitle': function(event) {
        if (event) event.preventDefault();
        if (this.processing) return;

        var sorting = io.getSorting(),
            query = io.getQuery();
        if (sorting.sortby == 'title') return;
        sorting.sortby = 'title';
        sorting.sortdirection = 'asc';
        factory.currentpage = '1';
        this[M('asyncGetZd<T>Full')](
          factory.currentpage, sorting.sortby,
          sorting.sortdirection, sorting.perpage, query
        );
        this.switchTo('loading_page', {
          page: t,
          page_articles: t == 'articles',
          page_categories: t == 'categories',
          page_sections: t == 'sections',
          page_dynamic_content: t == 'dynamic',
          query_term: query,
        });
        this.loadSyncPage = this[M('ui<T>Init')];
      },
      'ui<T>ResourceStatsComplete': function() {
        logger.debug(M('ui<T>ResourceStatsComplete'));
        var data = this[M('calcResourceName<T>')](this.store(zdApi.key)),
            num = data[t].length,
            resourceName, resource, has_error = false,
            projectData = this.store('tx_project'),
            projectResources = {},
            completion, resource_slugs;

        if (projectData && projectData.resources) {
          _.each(projectData.resources, function(entry) {
            projectResources[entry.slug] = entry.name;
          });
          resource_slugs = _.keys(projectResources);
        }
        for (var i = 0; i < num; i++) {
          resourceName = data[t][i].resource_name;
          resource = this.store(txResource.key + resourceName);
          var tx_completed = this.completedLanguages(resource);
          common.addCompletedLocales(resourceName, tx_completed);

          if (tx_completed.length) {
            $('#' + resourceName).prop('disabled', false).addClass('js-can-download');
          }
          var el_item = $(m('.js-<t>[data-resource="' + resourceName + '"]'));
          el_item.find('[data-status]').addClass('is-hidden');
          el_item.find('[data-item="controller"]').
            addClass('o-interactive-list__item').
            removeClass('o-status is-warning');

          //not uploaded resource
          if (typeof resource === 'number' && !_.contains(resource_slugs, resourceName)) {
            $('#' + resourceName).prop('disabled', false).addClass('js-can-upload');
            el_item.find('[data-status="not_found"]').removeClass('is-hidden');
          }
          //normal
          else if (typeof resource !== 'number') {
            completion = this.resourceCompletedPercentage(resource);
            if (completion == 100) {
              el_item.find('[data-status="completed"]').removeClass('is-hidden');
            } else {
              el_item.find('.js-trans-percentage').text(completion);
              el_item.find('[data-status="in_translation"]').removeClass('is-hidden');
            }
            $('#' + resourceName).prop('disabled', false).addClass('js-can-upload');
            el_item.find('[data-status="found"]').removeClass('is-hidden');
            el_item.find('[data-status="found"]').attr('data-original-title', projectResources[resourceName]);
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
          this.notifyWarning('Some Transifex resources could not be loaded. Please refresh to try again.');
        }
        $(m('.js-<t>.js-select-all')).prop('disabled', false);
        this[M('ui<T>LanguageComplete')]();
      },

      'ui<T>LanguageComplete': function() {
        logger.debug(M('ui<T>LanguageComplete'));

        var data = this[M('calcResourceName<T>')](this.store(zdApi.key)),
            numLanguages = 0,
            resourceName = '',
            resource = {};

        for (var i = 0; i < data[t].length; i++) {
          resourceName = data[t][i].resource_name;
          resource = this.store(txResource.key + resourceName);
          //TODO depends on resource typeness
          if (typeof resource !== 'number') {
            numLanguages = this.completedLanguages(resource).length;
            if (numLanguages) {
              $('#' + resourceName).addClass('js-can-download');
            }
          }
        }
      },

      'ui<T>GotoPage': function(event) {
        if (event) event.preventDefault();
        if (this.processing) return;

        logger.debug(M('ui<T>GotoPage'));
        var page = $(event.target).attr("data-page"),
            sorting = io.getSorting(),
            query = io.getQuery();
        factory.currentpage = page;
        this[M('asyncGetZd<T>Full')](
          factory.currentpage, sorting.sortby,
          sorting.sortdirection, sorting.perpage, query
        );
        this.switchTo('loading_page', {
          page: t,
          page_articles: t == 'articles',
          page_categories: t == 'categories',
          page_sections: t == 'sections',
          page_dynamic_content: t == 'dynamic',
          query_term: query,
        });
        this.loadSyncPage = this[M('ui<T>Init')];
      },

      'ui<T>BrandTab': function(event) {
        var brand;
        if (event && event.preventDefault) {
          event.preventDefault();
          brand = parseInt($(event.target).data('brand'));
        } else {
          brand = event;
        }
        var brands = this.store('brands');
        var sorting = io.getSorting();
        var query = io.getQuery();
        if (this.processing || !brand) return;
        this.selected_brand = _.findWhere(brands, {id: brand});
        // TODO FIX it will break when returning to default branch
        this.selected_brand.tx_project = (!this.selected_brand.default) ? 'zd-' + this.organization + '-' + this.selected_brand.id : this.project_slug;

        factory.currentpage = 1;
        var burl = (!this.selected_brand.default) ? this.selected_brand.brand_url : '';
        this.base_url = burl + '/api/v2/help_center/';
        this.asyncGetTxProject();
        this[M('ui<T>Sync')]();
      },
      'ui<T>AddNewBrandToTX': function(event) {
        var brand_slug;
        if (event && event.preventDefault) {
          event.preventDefault();
          let brand = _.find(this.store('brands'), {
            exists: false,
            has_help_center: true,
          });
          brand_slug = brand.subdomain;
        } else {
          brand_slug = event;
        }
        this.store('brandAdd', brand_slug);
        this.zdGetBrandLocales(brand_slug);
        this.switchTo('loading_page', {
          page: t,
          page_articles: t == 'articles',
          page_categories: t == 'categories',
          page_sections: t == 'sections',
          page_dynamic_content: t == 'dynamic',
          query_term: io.getQuery(),
        });
        this.loadSyncPage = this.uiAddBrandPage;
      },
    },
    actionHandlers: {
      'start<T>Process': function(action) {
        this.processing = true;
        this.notifyReset();
        $(m('.js-<t>.js-refresh')).addClass('is-disabled');
        $(m('.js-<t>.js-batch-upload')).addClass('is-disabled');
        $(m('.js-<t>.js-batch-download')).addClass('is-disabled');
        $(m('.js-<t>.js-checkbox')).prop('disabled', true);
        $(m('.js-<t>.js-select-all')).prop('disabled', true);
        $(m('.js-<t>[data-resource]')).each(function() {
          $(this).find('[data-item="controller"]:not(.js-perma-fail)').
            removeClass('o-status is-success is-error is-warning').
            addClass('o-interactive-list__item');
        });
        if (action == 'upload') {
          $(m('.js-<t>.js-batch-upload')).
            addClass('has-spinner').
            html('<span class="o-spinner o-button__spinner"></span>');
        }
        else if (action == 'download') {
          $(m('.js-<t>.js-batch-download')).
            addClass('has-spinner').
            html('<span class="o-spinner o-button__spinner"></span>');
        }
        //Clean up previous state
        $('[data-locale]').removeClass('o-status__text').addClass('u-color-secondary');
        $(m('.js-<t>[data-resource]')).removeClass('o-status is-error is-warning is-success').addClass('o-interactive-list__item');
      },

      'end<T>Process': function() {
        this.processing = false;
        $(m('.js-<t>.js-refresh')).removeClass('is-disabled');
        $(m('.js-<t>.js-checkbox')).prop('checked', false);
        $(m('.js-<t>.js-checkbox.js-can-upload')).prop('disabled', false);
        $(m('.js-<t>.js-checkbox.js-can-download')).prop('disabled', false);
        $(m('.js-<t>.js-select-all')).prop('disabled', false).
          prop('checked', false);
        this[M('ui<T>UpdateButtons')]();
      },

      'sync<T>Translations': function() {
        logger.debug(M('sync<T>Translations started'));
        var data = this.store(zdApi.key),
            OKToGetTranslations = typeof data != 'undefined' && data != null,
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
            OKToGetResourceStats = typeof data != 'undefined' && data != null,
            obj, num;
        if (OKToGetResourceStats) {
          obj = this[M('calcResourceName<T>')](data);
          num = obj[t].length;
          for (var i = 0; i < num; i++) {
            this.asyncGetTxResourceStats(obj[t][i].resource_name);
          }
        }
      },

      'buildSyncPage<T>Data': function() {
        var data = this.store(zdApi.key);
        if (data === null) {
          return;
        }
        var entries = this[M('calcResourceName<T>')](data),
            type = t,
            limit = entries[t].length,
            ret = [],
            d, e, s,
            tx_completed, zd_object_url, tx_resource_url, zd_object_updated;
        for (var i = 0; i < limit; i++) {
          e = entries[t][i];
          s = this.store(txResource.key + e.resource_name);
          tx_completed = this.completedLanguages(s);
          if (t == "dynamic"){
            zd_object_url = this.selected_brand.brand_url + "/agent/admin/dynamic_content/";
          } else {
            zd_object_url = this.selected_brand.brand_url + "/hc/" + e.source_locale +
              "/" + type + "/" + e.id;
          }
          tx_resource_url = this.tx + '/' + this.organization + '/' + this.selected_brand.tx_project + '/' + e.resource_name + '/';
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
            zd_outdated: t == 'dynamic' ? e.outdated : false
          }, {
            tx_resource_url: tx_resource_url
          }, {
            tx_completed: tx_completed
          }, {
            title_string: e.title
          });
          ret.push(d);
        }
        var paginationVisible = this.checkPagination(data);
        if (paginationVisible) {
          var currentPage = this.getCurrentPage(data);
          factory.currentpage = currentPage;
          ret = _.extend(ret, {
            page_prev_enabled: this.isFewer(data, currentPage),
            page_next_enabled: this.isMore(data, currentPage),
            current_page: currentPage,
            prev_page: currentPage - 1,
            next_page: currentPage + 1,
            pagination_visible: paginationVisible,
            pages: this.getPages(data)
          });
        }
        return ret;
      },

      'handleSearch<T>': function(){
        if (t != 'articles') {
          $('.js-search').addClass("u-display-none");
        }
        var search_query = this.store("search_query");
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

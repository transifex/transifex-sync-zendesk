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
      'keyup .js-<t>.js-search': M('ui<T>Search'),
      'click .js-<t>.js-clear-search': M('ui<T>Tab'),
      'click .js-<t>.js-create-project': M('ui<T>CreateProject'),
      'click .js-<t>-brand [data-brand]': M('ui<T>BrandTab'),
      'click .js-<t>-add-brand': M('ui<T>AddNewBrandToTX'),
    },
    eventHandlers: {
      'ui<T>Search': function(event) {
        if (this.processing) return;
        var code = event.which || event.keyCode;
        var search_query = this.$(m('.js-<t>.js-search :input')).val();
        if(search_query !== '') {
          this.$('.js-clear-search').removeClass("u-display-none");
        }
        else if (io.getQuery() === ''){
          this.$('.js-clear-search').addClass("u-display-none");
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
        this.$(m('.js-<t>.js-select-all')).prop(
          'checked',
          selected_count == this.$(m('.js-<t>.js-checkbox:not(:disabled)')).length
        );
      },
      'ui<T>Tab': function(event) {
        if (event) event.preventDefault();
        if (this.processing) return;
        var default_locale = this.store('default_locale').split('-')[0],
            project_locale = this.store(txProject.key).source_language_code.split('_')[0];
        if (project_locale !== default_locale){
          io.setPageError('txProject:locale');
        }
        io.setQuery('');
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
        this.switchTo('sync_page', {
          page: t,
          page_articles: t == 'articles',
          page_categories: t == 'categories',
          page_sections: t == 'sections',
          page_dynamic_content: t == 'dynamic',
          dataset: pageData,
          brands: this.buildBrandsData(),
          search_term: search_query,
        });

        var sorting = io.getSorting();
        this.$('.js-sortby-' + sorting.sortby).addClass("is-active");
        this.$('[perpage="' + sorting.perpage + '"]').addClass('is-active');
        this.$('.js-goto-page[data-page="' + factory.currentpage + '"]').addClass('is-active');

        this.original_upload_text = this.$(m('.js-<t>.js-batch-upload')).text();
        this.loadSyncPage = this[M('ui<T>ResourceStatsComplete')];
        this[M('syncResourceStats<T>')]();
        this[M('sync<T>Translations')]();
        this.$('[data-toggle="tooltip"]').tooltip();
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
        for (var i = 0; i < objects.length; i++) {
          entry = objects[i];
          txResourceName = entry.resource_name;
          resource_request = common.txRequestFormat(this[M('get<T>ForTranslation')](entry), category);
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
            sourceLocale = this.getSourceLocale(project),
            data = this.store(zdApi.key),
            obj = this[M('calcResourceName<T>')](data),
            entry, resource, txResourceName, completedLocales,
            zdLocale, translation, zd_locales;

        var objects = _.filter(obj[m('<t>')], function(o){
          return object_ids.indexOf(o.resource_name) !== -1;
        });
        this[M('start<T>Process')]('download');
        io.opResetAll();
        this.loadSyncPage = this[M('ui<T>DownloadComplete')];

        zd_locales = io.getLocales();
        for (var i = 0; i < objects.length; i++) {
          entry = objects[i];
          txResourceName = entry.resource_name;
          resource = this.store(txResource.key + txResourceName);
          completedLocales = this.completedLanguages(resource);

          for (var ii = 0; ii < completedLocales.length; ii++) { // iterate through list of locales
            translation = this.store(txResource.key + txResourceName + completedLocales[ii]);
            if (typeof translation.content === 'string') {
              zdLocale = syncUtil.txLocaletoZd(completedLocales[ii], zd_locales);
              this[M('zdUpsert<T>Translation')](translation.content, entry, zdLocale);
            }
          }
        }
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
          var el = this.$(m('.js-<t>[data-resource="' + resourceName + '"] [data-item="controller"]'));
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
          this.$('[data-resource] .o-status[data-item="controller"]:not(.is-success)').addClass('is-error');
        } else {
          this.notifyWarning((total - failed) + ' ' + content_type + ' were successfully uploaded to Transifex, ' + failed + ' ' + api + ' could not be uploaded.');
          this.$('[data-resource] .o-status[data-item="controller"]:not(.is-success)').addClass('is-warning');
        }
      },
      'ui<T>DownloadComplete': function() {
        var that = this;
        logger.debug('Download complete');
        this[M('end<T>Process')]();
        var resource_prefix = io.getFeature('html-tx-resource') ? 'HTML-' : '';
        var total = 0, failed = 0;

        _.each(io.opGetAll(), function(status, opName) {
          total++;
          var resourceName = m('<t>') + '-' + opName.split('_')[0];
          var resourceLoc  = opName.split('_')[1].toLowerCase().replace('-','_');
          var el = this.$(m('.js-<t>[data-resource="' + resourceName + '"] [data-locale="' + resourceLoc + '"]'));
          if (status !== 'success') {
            failed++;
            el.removeClass('u-color-secondary').addClass('js-locale-problem');
          } else {
            el.addClass('js-locale-ok');
          }
        }, this);

        var content_type = t == 'dynamic' ? 'dynamic content items' : m('<t>');
        if (failed === 0) {
          this.notifySuccess('Translations were successfully updated in ' + total + ' languages for all selected ' + content_type + ' .');
        } else if (failed == total) {
          this.$('.js-locale-problem')
            .removeClass('js-locale-problem')
            .addClass('u-color-systemError');
          this.notifyError('Translations could not be updated for any of the selected ' + content_type + ' .');
        } else {
          this.$('.js-locale-problem')
            .removeClass('js-locale-problem')
            .addClass('u-color-systemWarning');
          if (failed == 1) {
            this.notifyWarning('Translations were successfully updated for ' + (total - failed) + ' languages of the selected ' + content_type + ', 1 language could not be updated.');
          } else {
            this.notifyWarning('Translations were successfully updated for ' + (total - failed) + ' languages of the selected ' + content_type + ', ' + failed + ' languages could not be updated.');
          }
        }

        this.$(m('.js-<t>[data-resource]')).each(function() {
          var el = that.$(this); // Makes me sad...
          if (el.find('.js-locale-ok').length) {
            el.find('.js-locale-ok').removeClass('js-locale-ok');
            el.addClass('o-status').removeClass('o-interactive-list__item');
            el.addClass('is-success');
          }

          if (el.find('[data-locale].u-color-systemError').length ||
              el.find('[data-locale].u-color-systemWarning').length) {
            el.addClass('o-status').removeClass('o-interactive-list__item');
            if (failed == total)
              el.addClass('is-error');
            else
              el.addClass('is-warning');
          }
        });

      },
      'ui<T>PerPage': function(event) {
        if (event) event.preventDefault();
        if (this.processing) return;
        var sorting = io.getSorting(),
            query = io.getQuery();
        sorting.perpage = this.$(event.target).closest('[perpage]').attr('perpage');
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
          common.addCompletedLocales(this.$, resourceName, tx_completed);

          if (tx_completed.length) {
            this.$('#' + resourceName).prop('disabled', false).addClass('js-can-download');
          }
          var el_item = this.$(m('.js-<t>[data-resource="' + resourceName + '"]'));
          el_item.find('[data-status]').addClass('is-hidden');
          el_item.find('[data-item="controller"]').
            addClass('o-interactive-list__item').
            removeClass('o-status is-warning');

          //not uploaded resource
          if (typeof resource === 'number' && !_.contains(resource_slugs, resourceName)) {
            this.$('#' + resourceName).prop('disabled', false).addClass('js-can-upload');
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
            this.$('#' + resourceName).prop('disabled', false).addClass('js-can-upload');
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
      'ui<T>NextPage': function(event) {
        if (event) event.preventDefault();
        if (this.processing) return;

        logger.debug(M('ui<T>NextPage'));
        var page = this.$(event.target).attr("data-current-page"),
            nextPage = parseInt(page, 10) + 1,
            sorting = io.getSorting(),
            query = io.getQuery();
        factory.currentpage = nextPage;
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
      'ui<T>PrevPage': function(event) {
        if (event) event.preventDefault();
        if (this.processing) return;

        logger.debug(M('ui<T>PrevPage'));
        var page = this.$(event.target).attr("data-current-page"),
            prevPage = parseInt(page, 10) - 1,
            sorting = io.getSorting(),
            query = io.getQuery();
        factory.currentpage = prevPage;
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
        if (event) event.preventDefault();
        var brand = parseInt(this.$(event.target).data('brand'));
        var brands = this.store('brands');
        var sorting = io.getSorting();
        var query = io.getQuery();
        if (this.processing || !brand) return;
        this.selected_brand = _.findWhere(brands, {id: brand});
        this.asyncCheckTxProjectExists(this.selected_brand.subdomain);
        this.switchTo('loading_page', {
          page: t,
          page_articles: t == 'articles',
          page_categories: t == 'categories',
          page_sections: t == 'sections',
          page_dynamic_content: t == 'dynamic',
          query_term: io.getQuery(),
        });
        this.loadSyncPage = this[M('ui<T>ChangeBrand')];
      },
      'ui<T>SyncBrand': function(event) {
        factory.currentpage = 1;
        var burl = (!this.selected_brand.default) ? this.selected_brand.brand_url : '';
        this.base_url = burl + '/api/v2/help_center/';
        this[M('ui<T>Sync')]();
      },
      'ui<T>ChangeBrand': function(event) {
        if (event) event.preventDefault();
        var sorting = io.getSorting();
        var search_query = io.getQuery();
        this[M('ui<T>SyncBrand')]();
      },
      'ui<T>AddNewBrandToTX': function(event) {
        var brand_slug;
        if (event && event.preventDefault) {
          event.preventDefault();
          brand_slug = _.find(this.store('brands'), {
            exists: false,
            has_help_center: true,
          }).brand_url.replace('https://', '').replace('.zendesk.com', '');
        } else {
          brand_slug = event;
        }
        this.zdGetBrandLocales(brand_slug);
        this.switchTo('loading_page', {
          page: t,
          page_articles: t == 'articles',
          page_categories: t == 'categories',
          page_sections: t == 'sections',
          page_dynamic_content: t == 'dynamic',
          query_term: io.getQuery(),
        });
        this.loadSyncPage = this[M('ui<T>AddBrandPage')];
      },
      'ui<T>AddBrandPage': function(event) {
        this.switchTo('create_project', {
          brands: this.buildBrandsData(),
          locales: this.store('brandLocales'),
          source: this.store('brandSource')
        });
      },
      'ui<T>CreateProject': function(event) {
        if (event) event.preventDefault();
        logger.debug(M('ui<T>CreateProject'));
        var pageData = this[M('buildSyncPage<T>Data')]();

        var target_locale = this.store('default_locale');
        var split_locale = target_locale.split('-');
        if (split_locale.length > 1) {
          split_locale[1] = split_locale[1].toUpperCase();
          target_locale = split_locale.join('_');
        }
        this.asyncCreateTxProject( this.selected_brand, target_locale );
        this.switchTo('loading_page', {
          page: t,
          page_articles: t == 'articles',
          page_categories: t == 'categories',
          page_sections: t == 'sections',
          page_dynamic_content: t == 'dynamic',
          query_term: io.getQuery(),
        });
        this.loadSyncPage = this[M('ui<T>SyncBrand')];
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
        //Clean up previous state
        this.$('[data-locale]').removeClass('u-color-systemError u-color-systemWarning').addClass('u-color-secondary');
        this.$(m('.js-<t>[data-resource]')).removeClass('o-status is-error is-warning is-success').addClass('o-interactive-list__item');
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
      'buildBrandsData': function() {
        var brands = this.store('brands');
        if (!this.selected_brand) {
          this.selected_brand = _.findWhere(brands, {default: true});
        }
        return _.chain(brands)
          //.filter(datum => !datum.default) //Filter out default brand
          .map(datum => _.extend(datum, {
            selected: datum.id == this.selected_brand.id
          }))
          .value();
      },
      'buildSyncPage<T>Data': function() {
        var data = this.store(zdApi.key),
            entries = this[M('calcResourceName<T>')](data),
            type = t,
            limit = entries[t].length,
            ret = [],
            d, e, s,
            subdomain = this.currentAccount().subdomain(),
            tx_completed, zd_object_url, tx_resource_url, zd_object_updated;
        for (var i = 0; i < limit; i++) {
          e = entries[t][i];
          s = this.store(txResource.key + e.resource_name);
          tx_completed = this.completedLanguages(s);
          if (t == "dynamic"){
            zd_object_url = "https://" + subdomain + ".zendesk.com/agent/admin/dynamic_content/";
          } else {
            zd_object_url = "https://" + subdomain + ".zendesk.com/hc/" + e.source_locale +
              "/" + type + "/" + e.id;
          }
          tx_resource_url = `${this.tx}/${this.organization}/${this.selected_brand.subdomain}/${e.resource_name}`;
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
            current_page: this.getCurrentPage(data),
            pagination_visible: paginationVisible,
            pages: this.getPages(data)
          });
        }
        return ret;
      },
      'handleSearch<T>': function(){
        if (t != 'articles') {
          this.$('.js-search').addClass("u-display-none");
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

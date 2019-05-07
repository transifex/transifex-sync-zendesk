/**
 * UI notifications
 * @module ui/sync-articles
 */
import $ from 'jquery';

var syncUtil = require('../syncUtil');


module.exports = {
  events: {
    'change .js-brand-dropdown': 'uiBrandProjectSelect',
    'click .js-create-project': 'uiBrandCreateProject',
    'click .js-cancel': 'uiArticlesSync',
  },
  eventHandlers: {
    uiAddBrandPage: function(event) {
      var brand = _.find(
        this.store('brands'),
        item => item.subdomain == this.store('brandAdd')
      );
      this.switchTo('create_project', {
        brands: this.buildBrandsData().brands,
        locales: this.store('brandLocales'),
        source: this.store('brandSource'),
        has_target: Boolean(this.store('brandLocales') && this.store('brandLocales').length),
        brandName: brand ? brand.name : 'Unknown brand name'
      });
    },
    uiBrandCreateProject: function(event) {
      event.preventDefault();
      var brand = _.find(
        this.store('brands'),
        item => item.subdomain == this.store('brandAdd')
      );
      this.asyncCreateTxProject(
        'zd-' + this.organization + '-' + brand.id,
        $('.js-brand-project-name').val(),
        syncUtil.zdLocaletoTx(this.store('brandSource').locale),
        _.map(this.store('brandLocales'), 'locale').map(syncUtil.zdLocaletoTx),
        brand.id
      );
      this.switchTo('create_project_loading', {creating_project: true});
      this.loadSyncPage = this.uiArticlesSync;
    },
    uiBrandProjectSelect: function(event) {
      event.preventDefault();
      var brand = $(event.target).val();
      this.store('brandAdd', brand);
      this.zdGetBrandLocales(brand);
      var t = 'brandsCreate';
      this.switchTo('create_project_loading', {
        page: t,
        page_articles: t == 'articles',
        page_categories: t == 'categories',
        page_sections: t == 'sections',
        page_dynamic_content: t == 'dynamic',
      });
      this.loadSyncPage = this.uiAddBrandPage;
    },
  },
  actionHandlers: {
    buildBrandsData: function() {
      var brands = this.store('brands');
      var has_more = (_.filter(brands, function(b) {
        return !b.exists && b.has_help_center;
      }).length > 0);
      if (this.selected_brand.default) {
        this.selected_brand = _.findWhere(brands, {default: true});
        this.selected_brand.tx_project = this.project_slug;
      }
      var that = this;
      var r = _.chain(brands)
        //.filter(datum => !datum.default) //Filter out default brand
        .map(function(datum) {
          return _.extend(datum, {
            selected: datum.id == that.selected_brand.id,
            tobeAdded: datum.subdomain == that.store('brandAdd')
          });
        })
        .value();

      return {brands: r, has_more: has_more};
    },
  },
};

/**
 * UI notifications
 * @module ui/sync-articles
 */
var syncUtil = require('../syncUtil');


module.exports = {
  events: {
    'change .js-brand-dropdown': 'uiBrandProjectSelect',
    'click .js-create-project': 'uiBrandCreateProject',
    'click .js-cancel': 'uiArticlesSync',
  },
  eventHandlers: {
    uiAddBrandPage: function(event) {
      this.switchTo('create_project', {
        brands: this.buildBrandsData().brands,
        locales: this.store('brandLocales'),
        source: this.store('brandSource'),
        has_target: this.store('brandLocales').length !== 0,
        brandName: _.find(this.store('brands'), {
          subdomain: this.store('brandAdd')
        }).name
      });
    },
    uiBrandCreateProject: function(event) {
      event.preventDefault();
      var brand = _.find(this.store('brands'), {
        subdomain: this.store('brandAdd')
      });
      this.asyncCreateTxProject(
        'zd-' + this.organization + '-' + brand.id,
        this.$('.js-brand-project-name').val(),
        syncUtil.zdLocaletoTx(this.store('brandSource').locale),
        _.map(this.store('brandLocales'), 'locale').map(syncUtil.zdLocaletoTx)
      );
      this.switchTo('create_project_loading', {creating_project: true});
      this.loadSyncPage = this.uiArticlesSync;
    },
    uiBrandProjectSelect: function(event) {
      event.preventDefault();
      var brand = this.$(event.target).val();
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

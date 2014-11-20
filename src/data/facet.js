define(function(require, exports, module) {
  'use strict';
  var flight = require('flight');
  var $ = require('jquery');
  var _ = require('lodash');
  var L = require('leaflet');

  module.exports = flight.component(function facet() {
    this.configure = function(ev, config) {
      this.attr.config = config.facets;
      this.attr.selected = {};
      this.attr.facets = {};
      if (this.attr.data) {
        this.initializeFacets();
      }
    };

    this.loadData = function(ev, data) {
      if (!this.attr.data) {
        this.attr.data = data;
        if (this.attr.config) {
          this.initializeFacets();
        }
      }
    };

    this.filterFeatures = function(geojson, selected) {
      // given a GeoJSON struture and a set of selected facets, return a
      // GeoJSON structured filtered to the features which match the
      // selected facets
      if (selected) {
        var features = _.filter(
          this.attr.data.features,
          function(feature) {
            return _.all(
              selected,
              _.bind(function(selected, key) {
                var type = this.attr.config[key].type;
                if (type === 'map') {
                  if (!this.mapBounds) {
                    return false;
                  }
                  return this.mapBounds.contains([
                    feature.geometry.coordinates[1],
                    feature.geometry.coordinates[0]
                  ]);
                }
                var property = feature.properties[key];
                if (!_.isArray(property)) {
                  property = [property];
                }
                // calculate the intersection of our selected values and
                // the values on the given feature
                var intersection = _.intersection(selected, property);
                if (this.attr.config[key].type === 'list') {
                  // must match all of the values
                  return intersection.length === selected.length;
                } else {
                  // must match any value
                  return intersection.length > 0;
                }
              }, this));
          }, this);
        geojson = _.defaults({features: features}, this.attr.data);
      }
      return geojson;
    };

    // returns an object with each facet, and a list of facet values
    this.identifyFacets = function() {
      return _.mapValues(
        this.attr.config,
        _.bind(function(facetConfig, facet) {
          // adds up the count of the values on the given facet
          if (facetConfig.type === 'map') {
            if (facetConfig.value) {
              this.attr.selected[facet] = [facetConfig.text];
            }
            return [facetConfig.text];
          }
          return _.chain(this.attr.data.features)
            .map(function(feature) {
              // values of the facet on the given feature
              return feature.properties[facet];
            })
            .flatten(true)
            .uniq()
            .sortBy(function(value) { return value.toLowerCase(); })
            .value();
        }, this));
    };

    this.initializeFacets = function() {
      this.attr.facets = this.identifyFacets();
      this.filterFacets(this.attr.data);
    };

    this.filterFacets = function(data) {
      var selectedFacets = this.attr.selected,
          facets = this.attr.facets,
          filterFeatures = _.bind(this.filterFeatures, this),
          featureCount = data.features.length,
          filteredCounts = _.mapValues(
            this.attr.config,
            function(facetConfig, facet) {
              var selectedValues = selectedFacets[facet] || [];
              return _.chain(facets[facet])
                .map(function(value) {
                  var selected = _.contains(selectedValues, value),
                      count;
                  if (selected) {
                    // if the value is already selected, then the count is
                    // just the current count
                    count = featureCount;
                  } else {
                    // otherwise, generate a new selection which includes
                    // the value
                    var selectedWithValue = _.cloneDeep(selectedFacets);
                    selectedWithValue[facet] = _.union(
                      selectedWithValue[facet],
                      [value]);
                    // and and filter the features with the new selection
                    count = filterFeatures(data, selectedWithValue).features.length;
                    // for non-list facets, adding a selection can increase
                    // the number of features returned, but we actually
                    // just want to show the number of additional features
                    // that will be displayed
                    if (facetConfig.type !== 'list' &&
                        selectedValues.length &&
                        count >= featureCount) {
                      count = count - featureCount;
                    }
                  }
                  return {value: value,
                          count: count,
                          selected: selected
                         };
                })
                .value();
            });
      $(document).trigger('dataFacets', filteredCounts);
    };

    this.filterData = function(ev, params) {
      var facet = params.facet,
          selectedValues = params.selected;
      if (!selectedValues.length) {
        delete this.attr.selected[facet];
      } else {
        this.attr.selected[facet] = selectedValues;
      }
      this._updateFilteredData();
    };

    this._updateFilteredData = function() {
      var geojson = this.filterFeatures(this.attr.data, this.attr.selected);
      $(document).trigger('dataFiltered', geojson);
      this.filterFacets(geojson);
    };

    this.onMapBounds = function(ev, data) {
      this.mapBounds = L.latLngBounds(
        L.latLng(data.southWest),
        L.latLng(data.northEast));
      if (this.attr.config && this.attr.data) {
        this._updateFilteredData();
      }
    };

    this.after('initialize', function() {
      this.on(document, 'config', this.configure);
      this.on(document, 'data', this.loadData);
      this.on(document, 'uiFilterFacet', this.filterData);
      this.on(document, 'mapBounds', this.onMapBounds);
    });
  });
});

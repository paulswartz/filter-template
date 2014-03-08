define('test/spec/data/facet_spec', ['test/mock', 'lodash'], function(mock, _) {
  'use strict';
  describeComponent('data/facet', function() {
    beforeEach(function() {
      setupComponent();
      spyOnEvent(document, 'dataFacets');
      spyOnEvent(document, 'dataFiltered');
      spyOnEvent(document, 'data');
    });

    describe('on config', function() {
      beforeEach(function() {
        this.component.trigger('config', mock.config);
      });
      it('records the facets to display', function() {
        expect(this.component.attr.config).toEqual(mock.config.facets);
      });
    });

    describe('on data', function() {
      beforeEach(function() {
        this.component.trigger('config', mock.config);
        this.component.trigger('data', mock.data);
      });
      it('emits a "dataFacets" event with the values for each facet', function() {
        expect('dataFacets').toHaveBeenTriggeredOnAndWith(
          document,
          {services_offered: [
            {value: 'public education', count: 1, selected: false},
            {value: 'social group', count: 2, selected: false},
            {value: 'support group', count: 3, selected: false}]
          });
      });
    });

    describe('on uiFilterFacet', function() {
      beforeEach(function() {
        this.component.trigger('config', mock.config);
        this.component.trigger('data', mock.data);
      });
      describe("single value facet", function() {
        beforeEach(function() {
          var config = _.clone(mock.config);
          config.facets = {community: {title: "Community"}};
          this.component.trigger('config', config);
          this.component.trigger('uiFilterFacet', {
            facet: 'community',
            selected: ['Northampton']
          });
        });
        it('emits a "dataFiltered" event with the filtered data', function() {
          expect('dataFiltered').toHaveBeenTriggeredOnAndWith(
            document,
            {type: 'FeatureCollection',
             features: [mock.data.features[0]]
            });
        });
        it('emits a "dataFacets" event with the filtered values for each facet', function() {
          expect('dataFacets').toHaveBeenTriggeredOnAndWith(
            document,
            {community: [
              {value: 'Greenfield', count: 1, selected: false},
              {value: 'Northampton', count: 1, selected: true},
              {value: 'Shellbourne Falls', count: 1, selected: false}]
            });
        });
      });
      describe("list value facet", function() {
        beforeEach(function() {
          this.component.trigger('uiFilterFacet', {
            facet: 'services_offered',
            selected: ['social group']
          });
        });
        it('emits a "dataFiltered" event with the filtered data', function() {
          expect('dataFiltered').toHaveBeenTriggeredOnAndWith(
            document,
            {type: 'FeatureCollection',
             features: [mock.data.features[0],
                        mock.data.features[1]]
            });
        });
        it('emits a "dataFacets" event with the filtered values for each facet', function() {
          expect('dataFacets').toHaveBeenTriggeredOnAndWith(
            document,
            {services_offered: [
              {value: 'public education', count: 0, selected: false},
              {value: 'social group', count: 2, selected: true},
              {value: 'support group', count: 2, selected: false}]
            });
        });
      });
      describe("multiple facets", function() {
        beforeEach(function() {
          var config = _.clone(mock.config);
          config.facets.community = {title: "Community"};
          this.component.trigger('config', config);
          this.component.trigger('uiFilterFacet', {
            facet: 'services_offered',
            selected: ['social group']
          });
        });
        it('emits a "dataFiltered" event with the filtered data', function() {
          expect('dataFiltered').toHaveBeenTriggeredOnAndWith(
            document,
            {type: 'FeatureCollection',
             features: [mock.data.features[0],
                        mock.data.features[1]]
            });
          this.component.trigger('uiFilterFacet', {
            facet: 'community',
            selected: ['Northampton']
          });
          expect('dataFiltered').toHaveBeenTriggeredOnAndWith(
            document,
            {type: 'FeatureCollection',
             features: [mock.data.features[0]]
            });
        });
        it('emits a "dataFacets" event with the filtered values for each facet', function() {
          expect('dataFacets').toHaveBeenTriggeredOnAndWith(
            document,
            {community: [
              {value: 'Greenfield', count: 1, selected: false},
              {value: 'Northampton', count: 1, selected: false},
              {value: 'Shellbourne Falls', count: 0, selected: false}],
             services_offered: [
               {value: 'public education', count: 0, selected: false},
               {value: 'social group', count: 2, selected: true},
               {value: 'support group', count: 2, selected: false}]
            });
          this.component.trigger('uiFilterFacet', {
            facet: 'community',
            selected: ['Northampton']
          });
          expect('dataFacets').toHaveBeenTriggeredOnAndWith(
            document,
            {community: [
              {value: 'Greenfield', count: 1, selected: false},
              {value: 'Northampton', count: 1, selected: true},
              {value: 'Shellbourne Falls', count: 0, selected: false}],
             services_offered: [
               {value: 'public education', count: 0, selected: false},
               {value: 'social group', count: 1, selected: true},
               {value: 'support group', count: 1, selected: false}]
            });
        });
        it('does not filter away matching simple facets', function() {
          this.component.trigger('uiFilterFacet', {
            facet: 'services_offered',
            selected: ['public education']
          });
          expect('dataFacets').toHaveBeenTriggeredOnAndWith(
            document,
            {community: [
              {value: 'Greenfield', count: 0, selected: false},
              {value: 'Northampton', count: 0, selected: false},
              {value: 'Shellbourne Falls', count: 1, selected: false}],
             services_offered: [
               {value: 'public education', count: 1, selected: true},
               {value: 'social group', count: 0, selected: false},
               {value: 'support group', count: 1, selected: false}]
            });
        });
      });
      it('emits a "data" event with all data given an empty filter', function() {
        this.component.trigger('uiFilterFacet', {
          facet: 'community',
          selected: []
        });

        expect('data').toHaveBeenTriggeredOnAndWith(
          document,
          mock.data);
      });
    });
  });
});

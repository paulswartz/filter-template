var tests = [], testDeps = [], callback, baseUrl;

var specRegex = /(test\/spec\/(.+\/)?.+_spec)(\.js)?/;
function testFiles(o) {
  // given an object, return the keys which are specs
  'use strict';
  var tests = [], match;
  for (var file in o) {
    if (o.hasOwnProperty(file)) {
      match = specRegex.exec(file);
      if (match) {
        tests.push(match[1]);
      }
    }
  }
  return tests;
}

if (window.__karma__) {
  // local Karma
  tests = testFiles(window.__karma__.files);
  baseUrl = '/base/src/';
  callback = window.__karma__.start;
} else {
  // Testling
  testDeps = ['../node_modules/karma-jasmine/lib/jasmine',
              '../node_modules/jasmine-reporters/src/jasmine.tap_reporter'];
  baseUrl = 'src/';
  callback = function() {
    'use strict';
    var env = jasmine.getEnv();
    env.addReporter(new jasmine.TapReporter());
    env.execute();
  };
}

require.config({
  baseUrl: baseUrl,
  paths: {
    'test': '../test',
    'jquery': '../lib/jquery-1.10.2',
    'leaflet': '../lib/leaflet/leaflet',
    'handlebars': '../lib/handlebars',
    'lodash': '../lib/lodash.min',
    'flight': '../lib/flight.min',
    'jasmine-jquery': '../test/lib/jasmine-jquery',
    'jasmine-flight': '../test/lib/jasmine-flight'
  },
  shim: {
    'handlebars': {
      exports: 'Handlebars'
    },
    'underscore': {
      exports: '_'
    },
    'flight': {
      deps: ['../lib/es5-shim.min', '../lib/es5-sham.min'],
      exports: 'flight'
    },
    'jasmine-jquery': {
      deps: ['jquery'],
      exports: '$'
    },
    'jasmine-flight': {
      'deps': ['jasmine-jquery', 'flight'],
      exports: '$'
    }
  },

  deps: testDeps,
  callback: function() {
    'use strict';
    require(['jasmine-jquery', 'jasmine-flight'], function() {
      if (!tests.length) {
        tests = testFiles(require.s.contexts._.registry);
      }
      require(tests, function() {
        callback();
      });
    });
  }
});

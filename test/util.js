
var assert = require('assert');
var path = require('path');
var util = require('../lib/util');

global.application_root = __dirname;

describe('util.routeJoin', function() {

    it('should join 2 simple route', function() {
        assert.equal(util.routeJoin("/static", "js/app.js"), "/static/js/app.js");
    });

    it('should join a url with a route', function() {
        assert.equal(util.routeJoin("http://my.site.com/static", "js/app.js"), "http://my.site.com/static/js/app.js");
        assert.equal(util.routeJoin("https://my.site.com/static/", "js/app.js"), "https://my.site.com/static/js/app.js");
    });

    it('should handle absolute routes', function() {
        assert.equal(util.routeJoin("https://my.site.com/static/", "/js/app.js"), "https://my.site.com/js/app.js");
        assert.equal(util.routeJoin("https://my.site.com/static/", "/", "js/app.js"), "https://my.site.com/js/app.js");
    });

    it('should normalize the route', function() {
        assert.equal(util.routeJoin("https://my.site.com/static/", "../js/app.js"), "https://my.site.com/js/app.js");
        assert.equal(util.routeJoin("https://my.site.com/static/", "./../js/app.js"), "https://my.site.com/js/app.js");
        assert.equal(util.routeJoin("https://my.site.com/static/", "../js/../js/app.js"), "https://my.site.com/js/app.js");
        assert.equal(util.routeJoin("https://my.site.com/static/../static", "js/app.js"), "https://my.site.com/static/js/app.js");
    });

});

describe('util.stripExtension', function() {

    it('should strip the extension in a file', function() {
        assert.equal(util.stripExtension("app.js"), "app");
    });

    it('should strip the extension in a file path', function() {
        assert.equal(util.stripExtension("/static/js/app.js"), "/static/js/app");
    });

    it('should strip the extension in a url', function() {
        assert.equal(util.stripExtension("https://my.site.com/static/js/app.js"), "https://my.site.com/static/js/app");
    });

    it('should strip the extension in a url even when going up', function() {
        assert.equal(util.stripExtension("https://my.site.com/static/../js/app.js"), "https://my.site.com/static/../js/app");
    });

});

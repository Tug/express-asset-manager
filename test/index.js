var assert = require('assert');
var fs = require('fs-extra');
var path = require('path');
var libRoot = path.join(__dirname, '..');
var outputDir = path.join(libRoot, "test/builtAssets");
global.application_root = __dirname;


String.prototype.doesContain = function(subString) {
    return this.indexOf(subString) !== -1;
};

String.prototype.doesNotContain = function(subString) {
    return !this.doesContain(subString);
};

String.prototype.occurences = function(subString) {
    return (this.match(new RegExp(subString,"g")) || []).length;
};

describe('Asset Middleware in production', function() {

    var expressAssetMiddleware = require(path.join(libRoot, 'lib/index'));

    var middlewareConf = {
        env         : "production",
        rootRoute   : "/static",
        srcDir      : "./test/public",
        buildDir    : "./test/builtAssets"
    };

    it('should process JS assets using concatenation and minification in production', function(done) {
        var middleware = expressAssetMiddleware({
            "all.js": {
                type: "js",
                dir: "js",
                files: [
                    "../lib/require.js",
                    "../lib/jquery.test.js",
                    "app.js",
                    "controllers/test.js"
                ]
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            fs.readFile(path.join(middlewareConf.buildDir, "js", "all.js"), "utf8", function(err, content) {
                if(err) return done(err);
                assert.ok( content.length > 0 );
                var res = { locals: {} };
                middleware({}, res, function(err) {
                    var html = res.locals.asset("all.js");
                    assert.ok( html.doesContain('<script ') );
                    assert.ok( html.doesContain(' src="/static/js/all.js" ') );
                    assert.ok( html.doesContain(' type="text/javascript"') );
                    assert.ok( html.doesContain('</script>') );
                    done();
                });
            });
        });
    });

    it('should process CSS assets using concatenation and minification in production', function(done) {
        var middleware = expressAssetMiddleware({
            "all.css": {
                type: "css",
                dir: "css",
                files: [
                    "style.css",
                    "style-responsive.css"
                ]
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            fs.readFile(path.join(middlewareConf.buildDir, "css", "all.css"), "utf8", function(err, content) {
                if(err) return done(err);
                assert.ok( content.length > 0 );
                var res = { locals: {} };
                middleware({}, res, function(err) {
                    var html = res.locals.asset("all.css");
                    assert.ok( html.doesContain('<link ') );
                    assert.ok( html.doesContain(' href="/static/css/all.css" ') );
                    assert.ok( html.doesContain(' rel="stylesheet"') );
                    assert.ok( html.doesContain(' type="text/css"') );
                    done();
                });
            });
        });
    });

    it('should process JS assets with requirejs in production', function(done) {
        var middleware = expressAssetMiddleware({
            "app.js" : {
                type: "requirejs",
                dir: "js",
                main: "app.js",
                lib: "../lib/require.js"
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            fs.readFile(path.join(middlewareConf.buildDir, "js", "app.js"), "utf8", function(err, content) {
                if(err) return done(err);
                assert.ok( content.length > 0 );
                var res = { locals: {} };
                middleware({}, res, function(err) {
                    if(err) return done(err);
                    var html = res.locals.asset("app.js");
                    assert.ok( html.doesContain('<script ') );
                    assert.ok( html.doesContain(' src="/static/lib/require.js"') );
                    assert.ok( html.doesContain(' data-main="/static/js/app"') );
                    assert.ok( html.doesContain(' type="text/javascript"') );
                    assert.ok( html.doesContain('</script>') );
                    done();
                })
            });
        });
    });

    it('should process JS assets with requirejs in production and include require.js library', function(done) {
        var middleware = expressAssetMiddleware({
            "app2.js" : {
                type: "requirejs",
                dir: "js",
                main: "app-withoutconfig.js",
                mainConfigFile: "config.js",
                lib: "../lib/require.js",
                includeLib: true,
                attributes: [ "async" ]
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            fs.readFile(path.join(middlewareConf.buildDir, "js", "app2.js"), "utf8", function(err, content) {
                if(err) return done(err);
                assert.ok( content.length > 0 );
                var res = { locals: {} };
                middleware({}, res, function(err) {
                    if(err) return done(err);
                    var html = res.locals.asset("app2.js");
                    assert.ok( html.doesContain('<script ') );
                    assert.ok( html.doesContain(' src="/static/js/app2.js"') );
                    assert.ok( html.doesContain(' async ') );
                    assert.ok( html.doesNotContain(' data-main="app"') );
                    assert.ok( html.doesNotContain(' src="/static/lib/require.js"') );
                    assert.ok( html.doesContain(' type="text/javascript"') );
                    assert.ok( html.doesContain('</script>') );
                    done();
                });
            });
        });
    });

    it('should process JS assets with requirejs in production with the complete url for CORS', function(done) {
        var middlewareCustomConf = {
            env         : "production",
            rootRoute   : "http://files.mydomain.com/static",
            srcDir      : "./test/public",
            buildDir    : "./test/builtAssets"
        };
        var middleware = expressAssetMiddleware({
            "app3.js" : {
                type: "requirejs",
                dir: "js",
                main: "app.js",
                lib: "../lib/require.js"
            }
        }, middlewareCustomConf, function(err) {
            if(err) return done(err);
            fs.readFile(path.join(middlewareCustomConf.buildDir, "js", "app3.js"), "utf8", function(err, content) {
                if(err) return done(err);
                assert.ok( content.length > 0 );
                var res = { locals: {} };
                middleware({}, res, function(err) {
                    var html = res.locals.asset("app3.js");
                    assert.ok( html.doesContain('<script ') );
                    assert.ok( html.doesContain(' src="http://files.mydomain.com/static/lib/require.js"') );
                    assert.ok( html.doesContain(' data-main="http://files.mydomain.com/static/js/app"') );
                    assert.ok( html.doesContain(' type="text/javascript"') );
                    assert.ok( html.doesContain('</script>') );
                    done();
                });
            });
        });
    });

    it('should process CSS assets with requirejs in production', function(done) {
        var middleware = expressAssetMiddleware({
            "ui.css": {
                type: "requirejs-css",
                dir: "css",
                main: "style.css"
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            fs.readFile(path.join(middlewareConf.buildDir, "css", "ui.css"), "utf8", function(err, content) {
                if(err) return done(err);
                assert.ok( content.length > 0 );
                var res = { locals: {} };
                middleware({}, res, function(err) {
                    var html = res.locals.asset("ui.css");
                    assert.ok( html.doesContain('<link ') );
                    assert.ok( html.doesContain(' href="/static/css/ui.css" ') );
                    assert.ok( html.doesContain(' rel="stylesheet"') );
                    assert.ok( html.doesContain(' type="text/css"') );
                    done();
                });
            });
        });
    });

    it('should process Less assets with lessc in production', function(done) {
        var middleware = expressAssetMiddleware({
            "ui2.css": {
                type: "less",
                dir: "less",
                main: "style.less"
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            fs.readFile(path.join(middlewareConf.buildDir, "less", "ui2.css"), "utf8", function(err, content) {
                if(err) return done(err);
                assert.ok( content.length > 0 );
                // ensure css files were also inlined
                assert.ok( content.doesNotContain('@import') );
                var res = { locals: {} };
                middleware({}, res, function(err) {
                    var html = res.locals.asset("ui2.css");
                    assert.ok( html.doesContain('<link ') );
                    assert.ok( html.doesContain(' href="/static/less/ui2.css" ') );
                    assert.ok( html.doesNotContain(' rel="stylesheet/less"') );
                    assert.ok( html.doesContain(' rel="stylesheet"') );
                    assert.ok( html.doesContain(' type="text/css"') );
                    done();
                });
            });
        });
    });

    it('should copy files and folders specified in options.copy', function(done) {
        var middlewareCustomConf = {
            env         : "development",
            rootRoute   : "/static",
            srcDir      : "./test/public",
            buildDir    : "./test/builtAssets",
            copy        : [ "img", "font" ]
        };
        var middleware = expressAssetMiddleware({}, middlewareCustomConf, function(err) {
            if(err) return done(err);
            var image = path.join(middlewareCustomConf.buildDir, "img", "subdir", "pixel.png");
            var font = path.join(middlewareCustomConf.buildDir, "font", "nofonthere.ttf");
            fs.readFile(image, "utf8", function(err, content) {
                assert.ok( content.length > 0 );
                fs.readFile(font, "utf8", function(err, content) {
                    assert.ok( content.length > 0 );
                    done();
                });
            });
        });
    });

    after(function(done) {
        fs.remove(outputDir, done);
    });

});



describe('Asset Middleware in development', function() {

    var expressAssetMiddleware = require(path.join(libRoot, 'lib/index'));

    var middlewareConf = {
        env         : "development",
        rootRoute   : "/static",
        srcDir      : "./test/public",
        buildDir    : "./test/builtAssets"
    };

    it('should process JS assets in development', function(done) {
        var middleware = expressAssetMiddleware({
            "all.js": {
                type: "js",
                dir: "js",
                files: [
                    "../lib/require.js",
                    "../lib/jquery.test.js",
                    "app.js",
                    "config.js",
                    "controllers/test.js"
                ]
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            var res = { locals: {} };
            middleware({}, res, function(err) {
                var html = res.locals.asset("all.js");
                assert.ok( html.occurences("<script ") === 5 );
                assert.ok( html.doesContain(' src="/static/lib/require.js"') );
                assert.ok( html.doesContain(' src="/static/lib/jquery.test.js"') );
                assert.ok( html.doesContain(' src="/static/js/app.js"') );
                assert.ok( html.doesContain(' src="/static/js/config.js"') );
                assert.ok( html.doesContain(' src="/static/js/controllers/test.js"') );
                assert.ok( html.occurences(' type="text/javascript"') === 5 );
                assert.ok( html.occurences("<\/script>") === 5 );
                done();
            });
        });
    });

    it('should process CSS assets in development', function(done) {
        var middleware = expressAssetMiddleware({
            "all.css": {
                type: "css",
                dir: "css",
                files: [
                    "style.css",
                    "style-responsive.css"
                ]
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            var res = { locals: {} };
            middleware({}, res, function(err) {
                var html = res.locals.asset("all.css");
                assert.ok( html.occurences("<link ") === 2 );
                assert.ok( html.doesContain(' href="/static/css/style.css" ') );
                assert.ok( html.doesContain(' href="/static/css/style-responsive.css" ') );
                assert.ok( html.occurences(' type="text/css"') === 2 );
                done();
            });
        });
    });

    it('should process JS assets with requirejs in development', function(done) {
        var middleware = expressAssetMiddleware({
            "app.js" : {
                type: "requirejs",
                dir: "js",
                main: "app",
                mainConfigFile: "config.js",
                lib: "../lib/require.js"
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            var res = { locals: {} };
            middleware({}, res, function(err) {
                var html = res.locals.asset("app.js");
                assert.ok( html.occurences("<script ") === 2 );
                assert.ok( html.doesContain(' src="/static/lib/require.js"') );
                assert.ok( html.doesContain(' data-main="/static/js/app"') );
                assert.ok( html.doesContain(' src="/static/js/config.js" ') );
                assert.ok( html.doesContain(' type="text/javascript"') );
                assert.ok( html.occurences(' type="text/javascript"') === 2 );
                assert.ok( html.occurences("<\/script>") === 2 );
                done();
            });
        });
    });

    it('should process JS assets with requirejs in development and rewrite urls for cross-domain', function(done) {
        var middlewareCustomConf = {
            env         : "development",
            rootRoute   : "http://files.mydomain.com/static",
            srcDir      : "./test/public",
            buildDir    : "./test/builtAssets"
        };
        var middleware = expressAssetMiddleware({
            "app3.js" : {
                type: "requirejs",
                dir: "js",
                main: "app",
                mainConfigFile: "config.js",
                lib: "../lib/require.js"
            }
        }, middlewareCustomConf, function(err) {
            if(err) return done(err);
            var res = { locals: {} };
            middleware({}, res, function(err) {
                var html = res.locals.asset("app3.js");
                assert.ok( html.occurences("<script ") === 2 );
                assert.ok( html.doesContain(' src="http://files.mydomain.com/static/lib/require.js"') );
                assert.ok( html.doesContain(' data-main="http://files.mydomain.com/static/js/app"') );
                assert.ok( html.doesContain(' src="http://files.mydomain.com/static/js/config.js"') );
                assert.ok( html.occurences(' type="text/javascript"') === 2 );
                assert.ok( html.occurences("<\/script>") === 2 );
                done();
            });
        });
    });

    it('should process CSS assets with requirejs in development', function(done) {
        var middleware = expressAssetMiddleware({
            "ui.css": {
                type: "requirejs-css",
                dir: "css",
                main: "style.css"
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            var res = { locals: {} };
            middleware({}, res, function(err) {
                var html = res.locals.asset("ui.css");
                assert.ok( html.occurences("<link ") === 1 );
                assert.ok( html.doesContain(' href="/static/css/style.css"') );
                assert.ok( html.doesContain(' type="text/css"') );
                assert.ok( html.doesContain(' rel="stylesheet"') );
                done();
            });
        });
    });

    it('should process Less assets in development', function(done) {
        var middleware = expressAssetMiddleware({
            "ui2.css": {
                type: "less",
                dir: "less",
                main: "style.less",
                lib: "../lib/less.js"
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            var res = { locals: {} };
            middleware({}, res, function(err) {
                var html = res.locals.asset("ui2.css");
                assert.ok( html.doesContain('<link ') );
                assert.ok( html.doesContain(' href="/static/less/style.less" ') );
                assert.ok( html.doesContain(' rel="stylesheet/less"') );
                assert.ok( html.doesContain(' type="text/css"') );
                assert.ok( html.occurences("<script ") === 1 );
                assert.ok( html.doesContain(' src="/static/lib/less.js"') );
                assert.ok( html.occurences(' type="text/javascript"') === 1 );
                assert.ok( html.occurences("<\/script>") === 1 );
                done();
            });
        });
    });

});

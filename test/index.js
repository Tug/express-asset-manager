
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var libRoot = path.join(__dirname, '..');
var outputDir = path.join(libRoot, "test/builtAssets");
global.application_root = __dirname;

describe('Asset Middleware in production', function() {

    var expressAssetMiddleware = require(path.join(libRoot, 'lib/index'));
    var middlewareConf = {
        buildDir: './test/builtAssets',
        env: "production"
    };

    before(function(done) {
        fs.mkdir(outputDir, function(err) {
            done();
        });
    });

    it('should process JS assets using concatenation and minification', function(done) {
        var middleware = expressAssetMiddleware({
            "all.js": {
                type: "js",
                route: "/static/js",
                dir: "test/public/js",
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
            fs.readFile(path.join(middlewareConf.buildDir, "all.js"), "utf8", function(err, content) {
                if(err) return done(err);
                assert.ok( content.length > 0 );
                var res = { locals: {} };
                middleware({}, res, function(err) {
                    var html = res.locals.asset("all.js");
                    assert.ok( html.indexOf('<script ') !== -1 );
                    assert.ok( html.indexOf(' src="/static/js/all.js" ') !== -1 );
                    assert.ok( html.indexOf(' type="text/javascript"') !== -1 );
                    assert.ok( html.indexOf('</script>') !== -1 );
                    done();
                });
            });
        });
    });

    it('should process CSS assets using concatenation and minification', function(done) {
        var middleware = expressAssetMiddleware({
            "all.css": {
                type: "css",
                route: "/static/css",
                dir: "test/public/css",
                files: [
                    "style.css",
                    "style-responsive.css"
                ]
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            fs.readFile(path.join(middlewareConf.buildDir, "all.css"), "utf8", function(err, content) {
                if(err) return done(err);
                assert.ok( content.length > 0 );
                var res = { locals: {} };
                middleware({}, res, function(err) {
                    var html = res.locals.asset("all.css");
                    assert.ok( html.indexOf('<link ') !== -1 );
                    assert.ok( html.indexOf(' href="/static/css/all.css" ') !== -1 );
                    assert.ok( html.indexOf(' rel="stylesheet"') !== -1 );
                    assert.ok( html.indexOf(' type="text/css"') !== -1 );
                    done();
                });
            });
        });
    });

    it('should process JS assets with requirejs in production mode', function(done) {
        var middleware = expressAssetMiddleware({
            "app.js" : {
                type: "requirejs",
                route: "/static/js",
                dir: "test/public/js",
                main: "app",
                mainConfigFile: "config.js",
                lib: "../lib/require.js"
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            fs.readFile(path.join(middlewareConf.buildDir, "app.js"), "utf8", function(err, content) {
                if(err) return done(err);
                assert.ok( content.length > 0 );
                var res = { locals: {} };
                middleware({}, res, function(err) {
                    if(err) return done(err);
                    var html = res.locals.asset("app.js");
                    assert.ok( html.indexOf('<script ') !== -1 );
                    assert.ok( html.indexOf(' src="/static/lib/require.js"') !== -1 );
                    assert.ok( html.indexOf(' data-main="/static/js/app.js"') !== -1 );
                    assert.ok( html.indexOf(' type="text/javascript"') !== -1 );
                    assert.ok( html.indexOf('</script>') !== -1 );
                    done();
                })
            });
        });
    });

    it('should process JS assets with requirejs in production mode and include require.js library', function(done) {
        var middleware = expressAssetMiddleware({
            "app2.js" : {
                type: "requirejs",
                route: "/static/js",
                dir: "test/public/js",
                main: "app",
                mainConfigFile: "config.js",
                lib: "../lib/require.js",
                includeLib: true,
                attributes: [ "async" ]
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            fs.readFile(path.join(middlewareConf.buildDir, "app2.js"), "utf8", function(err, content) {
                if(err) return done(err);
                assert.ok( content.length > 0 );
                var res = { locals: {} };
                middleware({}, res, function(err) {
                    if(err) return done(err);
                    var html = res.locals.asset("app2.js");
                    assert.ok( html.indexOf('<script ') !== -1 );
                    assert.ok( html.indexOf(' src="/static/js/app2.js"') !== -1 );
                    assert.ok( html.indexOf(' async ') !== -1 );
                    assert.ok( html.indexOf(' data-main="/static/js/app.js"') === -1 );
                    assert.ok( html.indexOf(' src="/static/lib/require.js"') === -1 );
                    assert.ok( html.indexOf(' type="text/javascript"') !== -1 );
                    assert.ok( html.indexOf('</script>') !== -1 );
                    done();
                });
            });
        });
    });

    it('should process JS assets with requirejs in production mode and rewrite urls for cross-domain', function(done) {
        var middleware = expressAssetMiddleware({
            "app3.js" : {
                type: "requirejs",
                route: "/static/js",
                dir: "test/public/js",
                main: "app",
                mainConfigFile: "config.js",
                lib: "../lib/require.js"
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            fs.readFile(path.join(middlewareConf.buildDir, "app3.js"), "utf8", function(err, content) {
                if(err) return done(err);
                assert.ok( content.length > 0 );
                var res = { locals: {} };
                middleware({}, res, function(err) {
                    var html = res.locals.asset("app3.js", { prefix: "http://files.mydomain.com/" });
                    assert.ok( html.indexOf('<script ') !== -1 );
                    assert.ok( html.indexOf(' src="http://files.mydomain.com/static/lib/require.js"') !== -1 );
                    assert.ok( html.indexOf(' data-main="http://files.mydomain.com/static/js/app3.js"') !== -1 );
                    assert.ok( html.indexOf(' type="text/javascript"') !== -1 );
                    assert.ok( html.indexOf('</script>') !== -1 );
                    done();
                });
            });
        });
    });

    it('should process CSS assets with requirejs in production mode', function(done) {
        var middleware = expressAssetMiddleware({
            "ui.css": {
                type: "requirejs-css",
                route: "/static/css",
                dir: "test/public/css",
                main: "style.css"
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            fs.readFile(path.join(middlewareConf.buildDir, "ui.css"), "utf8", function(err, content) {
                if(err) return done(err);
                assert.ok( content.length > 0 );
                var res = { locals: {} };
                middleware({}, res, function(err) {
                    var html = res.locals.asset("ui.css");
                    assert.ok( html.indexOf('<link ') !== -1 );
                    assert.ok( html.indexOf(' href="/static/css/ui.css" ') !== -1 );
                    assert.ok( html.indexOf(' rel="stylesheet"') !== -1 );
                    assert.ok( html.indexOf(' type="text/css"') !== -1 );
                    done();
                });
            });
        });
    });

    it('should process Less assets with lessc in production mode', function(done) {
        var middleware = expressAssetMiddleware({
            "ui2.css": {
                type: "less",
                route: "/static/less",
                dir: "test/public/less",
                main: "style.less"
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            fs.readFile(path.join(middlewareConf.buildDir, "ui2.css"), "utf8", function(err, content) {
                if(err) return done(err);
                assert.ok( content.length > 0 );
                // ensure css files were also inlined
                assert.ok( content.indexOf('@import') === -1 );
                var res = { locals: {} };
                middleware({}, res, function(err) {
                    var html = res.locals.asset("ui2.css");
                    assert.ok( html.indexOf('<link ') !== -1 );
                    assert.ok( html.indexOf(' href="/static/less/ui2.css" ') !== -1 );
                    assert.ok( html.indexOf(' rel="stylesheet/less"') === -1 );
                    assert.ok( html.indexOf(' type="text/css"') !== -1 );
                    done();
                });
            });
        });
    });

    after(function(done) {
        var files = [];
        if(fs.existsSync(outputDir)) {
            files = fs.readdirSync(outputDir);
            files.forEach(function(file, index){
                var curPath = path.join(outputDir, file);
                fs.unlinkSync(curPath);
            });
            fs.rmdirSync(outputDir);
        }
        done();
    });

});



describe('Asset Middleware in development', function() {

    var expressAssetMiddleware = require(path.join(libRoot, 'lib/index'));

    it('should process JS assets', function(done) {
        var middleware = expressAssetMiddleware({
            "all.js": {
                type: "js",
                route: "/static/js",
                dir: "test/public/js",
                files: [
                    "../lib/require.js",
                    "../lib/jquery.test.js",
                    "app.js",
                    "config.js",
                    "controllers/test.js"
                ]
            }
        }, function(err) {
            if(err) return done(err);
            var res = { locals: {} };
            middleware({}, res, function(err) {
                var html = res.locals.asset("all.js");
                assert.ok( html.match(/<script /g).length === 5 );
                assert.ok( html.indexOf(' src="/static/lib/require.js"') !== -1 );
                assert.ok( html.indexOf(' src="/static/lib/jquery.test.js"') !== -1 );
                assert.ok( html.indexOf(' src="/static/js/app.js"') !== -1 );
                assert.ok( html.indexOf(' src="/static/js/config.js"') !== -1 );
                assert.ok( html.indexOf(' src="/static/js/controllers/test.js"') !== -1 );
                assert.ok( html.match(/ type="text\/javascript"/g).length === 5 );
                assert.ok( html.match(/<\/script>/g).length === 5 );
                done();
            });
        });
    });

    it('should process CSS assets', function(done) {
        var middleware = expressAssetMiddleware({
            "all.css": {
                type: "css",
                route: "/static/css",
                dir: "test/public/css",
                files: [
                    "style.css",
                    "style-responsive.css"
                ]
            }
        }, function(err) {
            if(err) return done(err);
            var res = { locals: {} };
            middleware({}, res, function(err) {
                var html = res.locals.asset("all.css");
                assert.ok( html.match(/<link /g).length === 2 );
                assert.ok( html.indexOf(' href="/static/css/style.css" ') !== -1 );
                assert.ok( html.indexOf(' href="/static/css/style-responsive.css" ') !== -1 );
                assert.ok( html.match(/ type="text\/css"/g).length === 2 );
                done();
            });
        });
    });

    it('should process JS assets with requirejs in development mode', function(done) {
        var middleware = expressAssetMiddleware({
            "app.js" : {
                type: "requirejs",
                route: "/static/js",
                dir: "test/public/js",
                main: "app",
                mainConfigFile: "config.js",
                lib: "../lib/require.js"
            }
        }, function(err) {
            if(err) return done(err);
            var res = { locals: {} };
            middleware({}, res, function(err) {
                var html = res.locals.asset("app.js");
                assert.ok( html.match(/<script /g).length === 2 );
                assert.ok( html.indexOf(' src="/static/lib/require.js"') !== -1 );
                assert.ok( html.indexOf(' data-main="/static/js/app"') !== -1 );
                assert.ok( html.indexOf(' src="/static/js/config.js" ') !== -1 );
                assert.ok( html.indexOf(' type="text/javascript"') !== -1 );
                assert.ok( html.match(/ type="text\/javascript"/g).length === 2 );
                assert.ok( html.match(/<\/script>/g).length === 2 );
                done();
            });
        });
    });

    it('should process JS assets with requirejs in development mode and rewrite urls for cross-domain', function(done) {
        var middleware = expressAssetMiddleware({
            "app3.js" : {
                type: "requirejs",
                route: "/static/js",
                dir: "test/public/js",
                main: "app",
                mainConfigFile: "config.js",
                lib: "../lib/require.js"
            }
        }, function(err) {
            if(err) return done(err);
            var res = { locals: {} };
            middleware({}, res, function(err) {
                var html = res.locals.asset("app3.js", { prefix: "http://files.mydomain.com/" });
                assert.ok( html.match(/<script /g).length === 2 );
                assert.ok( html.indexOf(' src="http://files.mydomain.com/static/lib/require.js"') !== -1 );
                assert.ok( html.indexOf(' data-main="http://files.mydomain.com/static/js/app"') !== -1 );
                assert.ok( html.indexOf(' src="http://files.mydomain.com/static/js/config.js"') !== -1 );
                assert.ok( html.match(/ type="text\/javascript"/g).length === 2 );
                assert.ok( html.match(/<\/script>/g).length === 2 );
                done();
            });
        });
    });

    it('should process CSS assets with requirejs in development mode', function(done) {
        var middleware = expressAssetMiddleware({
            "ui.css": {
                type: "requirejs-css",
                route: "/static/css",
                dir: "test/public/css",
                main: "style.css"
            }
        }, function(err) {
            if(err) return done(err);
            var res = { locals: {} };
            middleware({}, res, function(err) {
                var html = res.locals.asset("ui.css");
                assert.ok( html.match(/<link /g).length === 1 );
                assert.ok( html.indexOf(' href="/static/css/style.css"') !== -1 );
                assert.ok( html.indexOf(' type="text/css"') !== -1 );
                assert.ok( html.indexOf(' rel="stylesheet"') !== -1 );
                done();
            });
        });
    });

    it('should process Less assets in development mode', function(done) {
        var middleware = expressAssetMiddleware({
            "ui2.css": {
                type: "less",
                route: "/static/less",
                dir: "test/public/less",
                main: "style.less",
                lib: "../lib/less.js"
            }
        }, function(err) {
            if(err) return done(err);
            var res = { locals: {} };
            middleware({}, res, function(err) {
                var html = res.locals.asset("ui2.css");
                assert.ok( html.indexOf('<link ') !== -1 );
                assert.ok( html.indexOf(' href="/static/less/style.less" ') !== -1 );
                assert.ok( html.indexOf(' rel="stylesheet/less"') === -1 );
                assert.ok( html.indexOf(' type="text/css"') !== -1 );
                assert.ok( html.match(/<script /g).length === 1 );
                assert.ok( html.indexOf(' src="/static/lib/less.js"') !== -1 );
                assert.ok( html.match(/ type="text\/javascript"/g).length === 1 );
                assert.ok( html.match(/<\/script>/g).length === 1 );
                done();
            });
        });
    });

});
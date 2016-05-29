var chai = require('chai');
var expect = chai.expect;
var fs = require('fs-extra');
var path = require('path');
var libRoot = path.join(__dirname, '..');
var outputDir = path.join(libRoot, "test/builtAssets");

chai.use(require('chai-string'));

describe('Asset Middleware in production', function() {

    after(function(done) {
        fs.remove(outputDir, done);
    });

    var expressAssetMiddleware = require(path.join(libRoot, 'lib/index'));

    var middlewareConf = {
        env         : "production",
        rootRoute   : "/static",
        srcDir      : path.join(__dirname, "public"),
        buildDir    : path.join(__dirname, "builtAssets")
    };
/*
    it('should process JS assets using concatenation and minification in production', function(done) {
        var middleware = expressAssetMiddleware({
            "all.js": {
                type: "js",
                dir: "app/js",
                files: [
                    "../../lib/require.js",
                    "../../lib/jquery.test.js",
                    "app.js",
                    "controllers/test.js"
                ],
                generateSourceMaps: true,
                fingerprint: true
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            var md5Hash = "7584fbbd002cc967a4ec068ed08e2216";
            var fileName = md5Hash+"-all.js";
            fs.readFile(path.join(middlewareConf.buildDir, "app", "js", fileName), "utf8", function(err, content) {
                if(err) return done(err);
                expect( content ).to.have.length.above(0);
                var res = { locals: {} };
                middleware({}, res, function(err) {
                    var html = res.locals.asset("all.js");
                    expect( html ).to.have.string('<script ');
                    expect( html ).to.have.string(' src="/static/app/js/'+fileName+'" ');
                    expect( html ).to.have.string(' type="text/javascript"');
                    expect( html ).to.have.string('</script>');
                    fs.readFile(path.join(middlewareConf.buildDir, "app", "js", fileName+".map"), "utf8", function(err, content) {
                        if(err) return done(err);
                        expect( content ).to.have.length.above(0);
                        done();
                    });
                });
            });
        });
    });

    it('should process CSS assets using concatenation and minification in production', function(done) {
        var middleware = expressAssetMiddleware({
            "all.css": {
                type: "css",
                dir: "app/css",
                files: [
                    "style.css",
                    "style-responsive.css"
                ]
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            fs.readFile(path.join(middlewareConf.buildDir, "app", "css", "all.css"), "utf8", function(err, content) {
                if(err) return done(err);
                expect( content ).to.have.length.above(0);
                var res = { locals: {} };
                middleware({}, res, function(err) {
                    var html = res.locals.asset("all.css");
                    expect( html ).to.have.string( '<link ' );
                    expect( html ).to.have.string( ' href="/static/app/css/all.css" ' );
                    expect( html ).to.have.string( ' rel="stylesheet"' );
                    expect( html ).to.have.string( ' type="text/css"' );
                    done();
                });
            });
        });
    });

    it('should process JS assets with requirejs in production', function(done) {
        var middleware = expressAssetMiddleware({
            "app.js" : {
                type: "requirejs",
                dir: "app/js",
                main: "app.js",
                lib: "../../lib/require.js"
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            fs.readFile(path.join(middlewareConf.buildDir, "app", "js", "app.js"), "utf8", function(err, content) {
                if(err) return done(err);
                expect( content ).to.have.length.above(0);
                var res = { locals: {} };
                middleware({}, res, function(err) {
                    if(err) return done(err);
                    var html = res.locals.asset("app.js");
                    expect( html ).to.have.string( '<script ' );
                    expect( html ).to.have.string( ' src="/static/lib/require.js"' );
                    expect( html ).to.have.string( ' data-main="/static/app/js/app"' );
                    expect( html ).to.have.string( ' type="text/javascript"' );
                    expect( html ).to.have.string( '</script>' );
                    done();
                });
            });
        });
    });

    it('should process JS assets with requirejs in production and include require.js library', function(done) {
        var middleware = expressAssetMiddleware({
            "app2.js" : {
                type: "requirejs",
                dir: "app/js",
                main: "app-withoutconfig.js",
                mainConfigFile: "config.js",
                lib: "../../lib/require.js",
                includeLib: true,
                attributes: [ "async" ]
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            fs.readFile(path.join(middlewareConf.buildDir, "app", "js", "app2.js"), "utf8", function(err, content) {
                if(err) return done(err);
                expect( content ).to.have.length.above(0);
                var res = { locals: {} };
                middleware({}, res, function(err) {
                    if(err) return done(err);
                    var html = res.locals.asset("app2.js");
                    expect( html ).to.have.string( '<script ' );
                    expect( html ).to.have.string( ' src="/static/app/js/app2.js"' );
                    expect( html ).to.have.string( ' async ' );
                    expect( html ).to.not.have.string( ' data-main="app"' );
                    expect( html ).to.not.have.string( ' src="/static/lib/require.js"' );
                    expect( html ).to.have.string( ' type="text/javascript"' );
                    expect( html ).to.have.string( '</script>' );
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
                dir: "app/js",
                main: "app.js",
                lib: "../../lib/require.js"
            }
        }, middlewareCustomConf, function(err) {
            if(err) return done(err);
            fs.readFile(path.join(middlewareCustomConf.buildDir, "app", "js", "app3.js"), "utf8", function(err, content) {
                if(err) return done(err);
                expect( content ).to.have.length.above(0);
                var res = { locals: {} };
                middleware({}, res, function(err) {
                    var html = res.locals.asset("app3.js");
                    expect( html ).to.have.string( '<script ' );
                    expect( html ).to.have.string( ' src="http://files.mydomain.com/static/lib/require.js"' );
                    expect( html ).to.have.string( ' data-main="http://files.mydomain.com/static/app/js/app"' );
                    expect( html ).to.have.string( ' type="text/javascript"' );
                    expect( html ).to.have.string( '</script>' );
                    done();
                });
            });
        });
    });

    it('should process CSS assets with requirejs in production', function(done) {
        var middleware = expressAssetMiddleware({
            "ui.css": {
                type: "requirejs-css",
                dir: "app/css",
                main: "style.css"
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            fs.readFile(path.join(middlewareConf.buildDir, "app", "css", "ui.css"), "utf8", function(err, content) {
                if(err) return done(err);
                expect( content ).to.have.length.above(0);
                var res = { locals: {} };
                middleware({}, res, function(err) {
                    var html = res.locals.asset("ui.css");
                    expect( html ).to.have.string( '<link ' );
                    expect( html ).to.have.string( ' href="/static/app/css/ui.css" ' );
                    expect( html ).to.have.string( ' rel="stylesheet"' );
                    expect( html ).to.have.string( ' type="text/css"' );
                    done();
                });
            });
        });
    });
*/
    it('should process Less assets with lessc in production', function(done) {
        var middleware = expressAssetMiddleware({
            "ui2.css": {
                type: "less",
                dir: "app/less",
                main: "style.less",
                env: {
                    relativeUrls: true
                }
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            fs.readFile(path.join(middlewareConf.buildDir, "app", "less", "ui2.css"), "utf8", function(err, content) {
                if(err) return done(err);
                expect( content ).to.have.length.above(0);
                // ensure css files were also inlined
                expect( content ).to.not.have.string( '@import' );
                // ensure relative paths in css interpreted as less files were rewritten
                expect( content ).to.have.string( 'url(../../common/font/google-opensans/uYKcPVoh6c5R0NpdEY5A-Q.woff)' );
                var res = { locals: {} };
                middleware({}, res, function(err) {
                    var html = res.locals.asset("ui2.css");
                    expect( html ).to.have.string( '<link ' );
                    expect( html ).to.have.string( ' href="/static/app/less/ui2.css" ' );
                    expect( html ).to.not.have.string( ' rel="stylesheet/less"' );
                    expect( html ).to.have.string( ' rel="stylesheet"' );
                    expect( html ).to.have.string( ' type="text/css"' );
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
            copy        : [ "img", "common" ]
        };
        var middleware = expressAssetMiddleware({}, middlewareCustomConf, function(err) {
            if(err) return done(err);
            var image = path.join(middlewareCustomConf.buildDir, "img", "subdir", "pixel.png");
            var font = path.join(middlewareCustomConf.buildDir, "common", "font", "nofonthere.ttf");
            fs.readFile(image, "utf8", function(err, content) {
                expect( content ).to.have.length.above(0);
                fs.readFile(font, "utf8", function(err, content) {
                    expect( content ).to.have.length.above(0);
                    done();
                });
            });
        });
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
                dir: "app/js",
                files: [
                    "../../lib/require.js",
                    "../../lib/jquery.test.js",
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
                expect( html ).to.have.entriesCount( "<script ", 5 );
                expect( html ).to.have.string( ' src="/static/lib/require.js"' );
                expect( html ).to.have.string( ' src="/static/lib/jquery.test.js"' );
                expect( html ).to.have.string( ' src="/static/app/js/app.js"' );
                expect( html ).to.have.string( ' src="/static/app/js/config.js"' );
                expect( html ).to.have.string( ' src="/static/app/js/controllers/test.js"' );
                expect( html ).to.have.entriesCount( ' type="text/javascript"', 5 );
                expect( html ).to.have.entriesCount( "<\/script>", 5 );
                done();
            });
        });
    });

    it('should process CSS assets in development', function(done) {
        var middleware = expressAssetMiddleware({
            "all.css": {
                type: "css",
                dir: "app/css",
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
                expect( html ).to.have.entriesCount( "<link ", 2 );
                expect( html ).to.have.string( ' href="/static/app/css/style.css" ' );
                expect( html ).to.have.string( ' href="/static/app/css/style-responsive.css" ' );
                expect( html ).to.have.entriesCount( ' type="text/css"', 2 );
                done();
            });
        });
    });

    it('should process JS assets with requirejs in development', function(done) {
        var middleware = expressAssetMiddleware({
            "app.js" : {
                type: "requirejs",
                dir: "app/js",
                main: "app",
                mainConfigFile: "config.js",
                lib: "../../lib/require.js"
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            var res = { locals: {} };
            middleware({}, res, function(err) {
                var html = res.locals.asset("app.js");
                expect( html ).to.have.entriesCount( "<script ", 2 );
                expect( html ).to.have.string( ' src="/static/lib/require.js"' );
                expect( html ).to.have.string( ' data-main="/static/app/js/app"' );
                expect( html ).to.have.string( ' src="/static/app/js/config.js" ' );
                expect( html ).to.have.string( ' type="text/javascript"' );
                expect( html ).to.have.entriesCount( ' type="text/javascript"', 2 );
                expect( html ).to.have.entriesCount( "<\/script>", 2 );
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
                dir: "app/js",
                main: "app",
                mainConfigFile: "config.js",
                lib: "../../lib/require.js"
            }
        }, middlewareCustomConf, function(err) {
            if(err) return done(err);
            var res = { locals: {} };
            middleware({}, res, function(err) {
                var html = res.locals.asset("app3.js");
                expect( html ).to.have.entriesCount( "<script ", 2 );
                expect( html ).to.have.string( ' src="http://files.mydomain.com/static/lib/require.js"' );
                expect( html ).to.have.string( ' data-main="http://files.mydomain.com/static/app/js/app"' );
                expect( html ).to.have.string( ' src="http://files.mydomain.com/static/app/js/config.js"' );
                expect( html ).to.have.entriesCount( ' type="text/javascript"', 2 );
                expect( html ).to.have.entriesCount( "<\/script>", 2 );
                done();
            });
        });
    });

    it('should process CSS assets with requirejs in development', function(done) {
        var middleware = expressAssetMiddleware({
            "ui.css": {
                type: "requirejs-css",
                dir: "app/css",
                main: "style.css"
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            var res = { locals: {} };
            middleware({}, res, function(err) {
                var html = res.locals.asset("ui.css");
                expect( html ).to.have.entriesCount( "<link ", 1 );
                expect( html ).to.have.string( ' href="/static/app/css/style.css"' );
                expect( html ).to.have.string( ' type="text/css"' );
                expect( html ).to.have.string( ' rel="stylesheet"' );
                done();
            });
        });
    });

    it('should process Less assets in development', function(done) {
        var middleware = expressAssetMiddleware({
            "ui2.css": {
                type: "less",
                dir: "app/less",
                main: "style.less",
                lib: "../../lib/less.js"
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            var res = { locals: {} };
            middleware({}, res, function(err) {
                var html = res.locals.asset("ui2.css");
                expect( html ).to.have.string( '<link ' );
                expect( html ).to.have.string( ' href="/static/app/less/style.less" ' );
                expect( html ).to.have.string( ' rel="stylesheet/less"' );
                expect( html ).to.have.string( ' type="text/css"' );
                expect( html ).to.have.entriesCount( "<script ", 1 );
                expect( html ).to.have.string( ' src="/static/lib/less.js"' );
                expect( html ).to.have.entriesCount( ' type="text/javascript"', 1 );
                expect( html ).to.have.entriesCount( "<\/script>", 1 );
                done();
            });
        });
    });

});

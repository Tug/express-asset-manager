
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var libRoot = path.join(__dirname, '..');
var outputDir = path.join(libRoot, "test/builtAssets");
global.application_root = __dirname;

describe('AssetMiddleWare', function() {

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

    it('should process js assets with requirejs in production mode', function(done) {
        var middleware = expressAssetMiddleware({
            "app.js" : {
                type: "js",
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
                done();
            });
        });
    });

    it('should process css assets with requirejs in production mode', function(done) {
        var middleware = expressAssetMiddleware({
            "ui.css": {
                type: "css",
                route: "/static/css",
                dir: "test/public/css",
                main: "style.css"
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            fs.readFile(path.join(middlewareConf.buildDir, "ui.css"), "utf8", function(err, content) {
                if(err) return done(err);
                done();
            });
        });
    });

    it('should process less assets with lessc in production mode', function(done) {
        var middleware = expressAssetMiddleware({
            "ui2.css": {
                type: "less",
                route: "/static/css",
                dir: "test/public/less",
                main: "style.less"
            }
        }, middlewareConf, function(err) {
            if(err) return done(err);
            fs.readFile(path.join(middlewareConf.buildDir, "ui2.css"), "utf8", function(err, content) {
                if(err) return done(err);
                done();
            });
        });
    });
/*
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
*/
});


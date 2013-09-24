
var assert = require("assert");
var mocks = require("mocks")
var loadFile = mocks.loadFile;
var path = require('path');
global.application_root = __dirname;
var libRoot = path.join(__dirname, '..'); 

describe('AssetMiddleWare', function() {

    var assetConf = {
        "app.js" : {
            type: "js",
            route: "/static/js",
            dir: path.join(__dirname, "public/js"),
            main: "app.js",
            mainConfigFile: "config.js",
            lib: "../lib/require.js"
        },
        "ui.css": {
            type: "css",
            route: "/static/css",
            dir: path.join(__dirname, "public/css"),
            main: "style.css"
        }
    };

    var middlewareConf = {
        buildDir: './builtAssets',
        env: "production"
    };

    it('should process all assets in production mode', function(done) {
        /*var filesystem = mocks.fs.create({
            "public" : {
                "js" : {
                    "controllers" : {
                        "test.js" : mocks.fs.file(0,
                                "define(['jquery'],                         \n"+
                                "   function($, require, exports, module) { \n"+
                                "    return {                               \n"+
                                "        jQueryVersion: function() {        \n"+
                                "            return $.fn.jquery;            \n"+
                                "        }                                  \n"+
                                "    };                                     \n"+
                                "});                                        \n")
                    },
                    "app.js": mocks.fs.file(0,
                            "require(['./controllers/test'], function(test){\n"+
                            "    test.jQueryVersion();                      \n"+
                            "});                                            \n"),
                    "config.js": mocks.fs.file(0,
                            "requirejs.config({                             \n"+
                            "   baseUrl: '/static/js',                      \n"+
                            "   paths: {                                    \n"+
                            "       'jquery': '../lib/jquery.min.js'        \n"+
                            "   }                                           \n"+
                            "});                                            \n"),
                },
                "lib" : {
                    "require.js": 1,
                    "jquery.js": mocks.fs.file(0, "window.jQuery={fn:{jquery:'1.10.2'}};")
                },
                "css" : {
                    "style.css" : mocks.fs.file(0,
                            "h1: {              \n"+
                            "    color: blue;   \n"+
                            "}                  \n")
                }
            }
        });
        var expressAssetMiddlewareFile = loadFile(libRoot+'/lib/assetmanager.js', { fs : filesystem }, {}, true);
        var expressAssetMiddleware = expressAssetMiddlewareFile.module.exports;
        */
        var expressAssetMiddleware = require(path.join(libRoot, 'lib/assetmanager'));
        var middleware = expressAssetMiddleware(assetConf, middlewareConf, function(err) {
            if(err) throw err;
            filesystem.readFile(middlewareConf.buildDir, "utf8", function(err, content) {
                if(err) throw err;
                console.log(content);
                done();
            });
        });
    });

});


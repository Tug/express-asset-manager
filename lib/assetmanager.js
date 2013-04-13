var fs = require('fs');
var path = require('path');
var compressor = require('node-minify');
var Step = require('step');
var debug = require('debug')('express-asset-manager');

module.exports = function(assets, options, callback) {

    options.env = options.env || process.env.NODE_ENV;
    options.compressors = options.compressors || {};
    options.compressors.js = options.compressors.js || 'gcc';
    options.compressors.css = options.compressors.css || 'sqwish';
    var defaultStatics = { '/static' : './public', '/assets': './builtAssets' };
    options.statics = options.statics || defaultStatics;
    options.assetsRoute = options.assetsRoute || '/assets';
    options.buildDir = options.buildDir || options.statics[options.assetsRoute] || './builtAssets';
    options.buffer = options.buffer || (8 * 1024 * 1024);
    assets = assets || [];

    var hook = startupHook(options);

    debug("Processing assets...");

    Step(function() {
        var group = this.group();
        for(var name in assets) {
            var assetGroup = assets[name];
            debug("Asset : "+name);
            assetGroup.name = name;
            assetGroup.dir = options.statics[assetGroup.route];

            hook(assetGroup, group());

            assetGroup.urls = assetGroup.files.map(function(file) {
                return path.join(assetGroup.route, file);
            });
            debug("Urls : ", assetGroup.urls);
        }
    }, function(err) {
        if(err) {
            debug("Error while processing assets : "+err.message);
            console.log(err.message);
        } else {
            debug("Assets processed successfully.");
        }
        callback && callback(err);
    });

    return function(req, res, next) {
        res.locals.asset = function(name) {
            var assetGroup = assets[name];
            var html = assetGroup.urls.map(function(url) {
                return assetToHtml(url, assetGroup);
            }).join("\n");
            return html;
        };
        next();
    };
};

function startupHook(options) {
    var hooks = {
        development: function(assetGroup, callback) {
            // do nothing
        },
        production: function(assetGroup, callback) {
            var dstFile = path.join(options.buildDir, assetGroup.name);
            var srcFiles = assetGroup.files.map(function(file) {
                return path.join(assetGroup.dir, file);
            });
            if(options.processAssets !== false) {
                new compressor.minify({
                    type: options.compressors[assetGroup.type],
                    fileIn: srcFiles,
                    fileOut: dstFile,
                    buffer: options.buffer,
                    callback: function(err) {
                        if(err) console.log(err);
                        callback && callback();
                    }
                });
            } else if(callback) {
                callback();
            }
            assetGroup.route = options.assetsRoute;
            assetGroup.files = [ assetGroup.name ];
        }
    };
    return hooks[options.env];
}

function assetToHtml(url, assetGroup) {
    var attribute = (assetGroup.attribute) ? assetGroup.attribute+" " : "";
    switch(assetGroup.type) {
    case "js":
        return '<script '+attribute+'src="'+url+'" type="text/javascript"></script>';
    case "css":
        return '<link '+attribute+'href="'+url+'" rel="stylesheet">';
    }
}

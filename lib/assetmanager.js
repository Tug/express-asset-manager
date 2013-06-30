var fs = require('fs');
var path = require('path');
var compressor = require('node-minify');
var Step = require('step');
var debug = require('debug')('express-asset-manager');

module.exports = function(assets, options, callback) {

    options.env = options.env || process.env.NODE_ENV || "development";
    options.compressors = options.compressors || {};
    options.compressors.js = options.compressors.js || 'gcc';
    options.compressors.css = options.compressors.css || 'sqwish';
    options.buildDir = options.buildDir || './builtAssets';
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
            assetGroup.dir = assetGroup.dir || "";
            assetGroup.filepaths = assetGroup.files.map(function(file) {
                return path.join(assetGroup.dir, file);
            });

            hook(assetGroup, group());

            assetGroup.urls = assetGroup.files.map(function(file) {
                return path.join(assetGroup.route, file);
            });
            debug(" Urls : ", assetGroup.urls);
        }
    }, function(err) {
        if(err) {
            debug("Error while processing assets : "+err.message);
        } else {
            debug("Assets processed successfully.");
        }
        callback && callback(err);
    });

    return function(req, res, next) {
        res.locals.asset = function(name, options) {
            options = options || {};
            options.prefix = options.prefix || "";
            var assetGroup = assets[name];
            if(assetGroup !== undefined) {
                var html = assetGroup.urls.map(function(url) {
                    return assetToHtml(options.prefix+url, assetGroup, options.attribute);
                }).join("\n");
                return html;
            } else {
                var parts = name.split(".");
                var extension = parts[parts.length-1];
                return assetToHtml(options.prefix+name, { type: extension }, options.attribute);
            }
        };
        next();
    };
};

function startupHook(options) {
    var hooks = {
        development: function(assetGroup, callback) {
            callback && callback();
            // do nothing
        },
        production: function(assetGroup, callback) {
            var dstFile = path.join(options.buildDir, assetGroup.name);
            if(options.processAssets === true) {
                new compressor.minify({
                    type: options.compressors[assetGroup.type],
                    fileIn: assetGroup.filepaths,
                    fileOut: dstFile,
                    buffer: options.buffer,
                    callback: callback
                });
            } else {
                callback && callback();
            }
            assetGroup.files = [ assetGroup.name ];
        }
    };
    return hooks[options.env];
}

function assetToHtml(url, assetGroup, attribute) {
    attribute = attribute || assetGroup.attribute || "";
    switch(assetGroup.type) {
    case "js":
        return '<script '+attribute+' src="'+url+'" type="text/javascript"></script>';
    case "css":
        return '<link '+attribute+' href="'+url+'" rel="stylesheet">';
    }
}

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
            assetGroup.filenames = assetGroup.files.map(function(file) {
                return path.basename(file);
            });
            assetGroup.dir = assetGroup.dir || options.buildDir;

            hook(assetGroup, group());

            assetGroup.urls = assetGroup.filenames.map(function(file) {
                return path.join(assetGroup.route, file);
            });
            debug("Urls : ", assetGroup.urls);
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
            var dstFile = path.join(assetGroup.dir, assetGroup.name);
            if(options.processAssets === false) {
                return callback && callback();
            }
            new compressor.minify({
                type: options.compressors[assetGroup.type],
                fileIn: assetGroup.files,
                fileOut: dstFile,
                buffer: options.buffer,
                callback: callback
            });
            assetGroup.filenames = [ assetGroup.name ];
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

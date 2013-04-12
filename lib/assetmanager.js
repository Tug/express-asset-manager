var fs = require('fs');
var path = require('path');
var compressor = require('node-minify');

module.exports = function(assets, options, callback) {

    options.env = options.env || process.env.NODE_ENV;
    options.compressors = options.compressors || {};
    options.compressors.js = options.compressors.js || 'uglifyjs';
    options.compressors.css = options.compressors.css || 'sqwish';
    options.statics = options.statics || { '/static' : './public' };
    callback = callback || function() {};
    assets = assets || [];
    
    var hook = startupHook(options);

    Step(function() {
        var group = this.group();
        for(var name in assets) {
            var assetGroup = assets[name];
            assetGroup.name = name;
            assetGroup.dir = options.statics[assetGroup.route];

            hook(assetGroup, group());
            
            assetGroup.urls = assetGroup.files.map(function(file) {
                return path.join(assetGroup.route, file);
            });
        }
    }, callback);

    return function(req, res, next) {
        res.locals.asset = function(name) {
            var assetGroup = assets[name];
            return assets[name].urls.map(function(url) {
                return assetToHtml(url, assetGroup.type);
            }).join("\n");
        };
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
            new compressor.minify({
                type: options.compressors[assetGroup.type],
                fileIn: srcFiles,
                fileOut: dstFile,
                callback: callback
            });
            assetGroup.files = [ assetGroup.name ];
        }
    };
    return hooks[options.env];
}

function assetToHtml(url, type) {
    switch(type) {
    case "js":
        return '<script src="'+path+'"></script>';
    case "css":
        return '<link href="'+path+'" rel="stylesheet">';
    }
}

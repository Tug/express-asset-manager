
var fs = require('fs');
var path = require('path');
var compressor = require('node-minify');

module.exports = function(assets, options) {

    options.env = options.env || process.env.NODE_ENV;
    options.compressors = options.compressors || {};
    options.compressors.js = options.compressors.js || 'uglifyjs';
    options.compressors.css = options.compressors.css || 'sqwish';
    options.statics = options.statics || { '/static' : './public' };

    assets = assets || [];
    var hook = startupHook(options);

    for(var name in assets) {
        var assetGroup = assets[name];
        assetGroup.name = name;
        assetGroup.dir = options.statics[assetGroup.route];

        hook(assetGroup);
        
        assetGroup.urls = assetGroup.files.map(function(file) {
            return path.join(assetGroup.route, file);
        });
    }

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
        development: function(assetGroup) {
            // do nothing
        },
        production: function(assetGroup) {
            var dstFile = path.join(options.buildDir, assetGroup.name);
            var srcFiles = assetGroup.files.map(function(file) {
                return path.join(assetGroup.dir, file);
            });
            new compressor.minify({
                type: options.compressors[type],
                fileIn: srcFiles,
                fileOut: dstFile,
                callback: callback || function(err) {
                    if(err) return console.log(err);
                    console.log(dstFile+" generated!");
                }
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

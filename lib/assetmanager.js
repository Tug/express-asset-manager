var fs = require('fs');
var path = require('path');
var compressor = require('node-minify');
var Step = require('step');
var debug = require('debug')('express-asset-manager');
var requirejs = require('requirejs');
var less = require('less');

module.exports = function(assetsGroupInfo, options, callback) {

    options.env = options.env || process.env.NODE_ENV || "development";
    options.compressors = options.compressors || {};
    options.compressors.js = options.compressors.js || 'gcc';
    options.compressors.css = options.compressors.css || 'sqwish';
    options.buildDir = options.buildDir || './builtAssets';
    options.buffer = options.buffer || (8 * 1024 * 1024);
    options.process = !!options.process;
    options.silent = options.silent || false;
    assetsGroupInfo = assetsGroupInfo || {};

    var hook = startupHook(options);

    debug("Processing assets...");

    var assets = {};

    Step(function preProcessAssets() {

        var group = this.group();

        for(var name in assetsGroupInfo) {

            var assetGroupInfo = assetsGroupInfo[name];
            debug("Asset : "+name);
            assetGroupInfo.name = name;
            assetGroupInfo.type = assetGroupInfo.type || assetGroupInfo.name.split('.').pop();
            assetGroupInfo.dir = assetGroupInfo.dir || "";
            assetGroupInfo.files = assetGroupInfo.files || [];
            assetGroupInfo.attribute = assetGroupInfo.attribute || "";
            assetGroupInfo.filepaths = assetGroupInfo.files.map(function(file) {
                return path.join(assetGroupInfo.dir, file);
            });
            assetGroupInfo.fileOut = path.join(options.buildDir, assetGroupInfo.name);

            assets[name] = hook[assetGroupInfo.type](assetGroupInfo, group());

        }

    }, function compileAssets(err, log) {
        var next = this;
        if(err) return next(err);
        debug(log);
        debug(" Assets : ", assets);
        debug("Assets processed successfully.");
        next();

    }, function jobDone(err) {
        if(err && !options.silent) console.log(err);
        callback && callback(err);
    });

    return function(req, res, next) {
        res.locals.asset = function(name, options) {
            var assetGroup = assets[name];
            if(assetGroup !== undefined) {
                return assetGroupToHTML(assetGroup, options);
            } else {
                return new Asset(name).toHTML();
            }
        };
        next();
    };
};

function startupHook(options) {
    var hooks = {
        development: {
            js: function(assetGroup, callback) {
                var assets = [];
                if(assetGroup.main) {  // load with requirejs
                    // TODO: allow multiple modules (with config file?)
                    assets.push(new Asset(
                            path.join(assetGroup.route, assetGroup.lib),
                            "js",
                            { "data-main": path.join(assetGroup.route, assetGroup.main) }));
                    assets.push(new Asset(path.join(assetGroup.route, assetGroup.mainConfigFile), "js"));
                } else if(assetGroup.files && assetGroup.files.length > 0) {
                    assets = assetGroupFilesToAssets(assetGroup);
                }
                callback();
                return assets;
            },
            css: function(assetGroup, callback) {
                callback();
                return assetGroupFilesToAssets(assetGroup);
            },
            less: function(assetGroup, callback) {
                var assets = [];
                // TODO: do not reload less.js for each asset
                assets.push(new Asset(path.join(assetGroup.route, assetGroup.main), assetGroup.type));
                assets.push(new Asset(path.join(assetGroup.route, assetGroup.lib), "js"));
                callback();
                return assets;
            }
        },
        production: {
            js: function(assetGroup, callback) {
                var assets = [];
                if(assetGroup.main) { // minify with requirejs optimizer
                    requirejs.optimize({
                        baseUrl: assetGroup.dir,
                        name: assetGroup.main,
                        mainConfigFile: path.join(assetGroup.dir, assetGroup.mainConfigFile),
                        include: assetGroup.lib,
                        out: assetGroup.fileOut
                    }, function(log) {
                        callback(null, log);
                    }, callback);
                    assets.push(new Asset(path.join(assetGroup.route, assetGroup.name), "js"));
                } else if(assetGroup.files && assetGroup.files.length > 0) { // concat files and minify
                    new compressor.minify({
                        type: options.compressors.js,
                        language: 'ECMASCRIPT5',
                        fileIn: assetGroup.filepaths,
                        fileOut: assetGroup.fileOut,
                        buffer: options.buffer,
                        callback: callback
                    });
                    assetGroup.files = [ assetGroup.name ];
                    assets = assetGroupFilesToAssets(assetGroup);
                }
                return assets;
            },
            css: function(assetGroup, callback) {
                if(assetGroup.main) { // optimize with requirejs
                    requirejs.optimize({
                        cssIn: path.join(assetGroup.dir, assetGroup.main),
                        out: assetGroup.fileOut,
                        optimizeCss: "standard"
                    }, function(log) {
                        callback(null, log);
                    }, callback);
                } else if(assetGroup.files && assetGroup.files.length > 0) { // concat files and minify
                    new compressor.minify({
                        type: options.compressors.css,
                        fileIn: assetGroup.filepaths,
                        fileOut: assetGroup.fileOut,
                        buffer: options.buffer,
                        callback: callback
                    });
                }
                assetGroup.files = [ assetGroup.name ];
                return assetGroupFilesToAssets(assetGroup);
            },
            less: function(assetGroup, callback) {
                var mainLessPath = path.join(assetGroup.dir, assetGroup.main);

                fs.readFile(mainLessPath, 'utf8', function(err, fileContent) {
                    if(err) return callback(err);
                    var dataString = fileContent.toString();

                    var parser = new less.Parser({
                        paths         : [ assetGroup.dir ],
                        optimization  : 1
                    });
                    parser.parse(dataString, function(err, cssTree) {
                        if(err) return callback(err);
                        var cssString = cssTree.toCSS({
                            compress   : true,
                            yuicompress: true
                        });
                        // TODO: inline CSS imports
                        fs.writeFile(assetGroup.fileOut, cssString, 'utf8', callback);
                    });
                });
                assetGroup.files = [ assetGroup.name ];
                return assetGroupFilesToAssets(assetGroup);
            }
        }
    };
    return hooks[options.env];
}

function Asset(url, type, attributes) {
    this.url = url;
    this.type = type || extension(url);
    this.attribute = "";
    if(typeof attributes === "object") {
        for(var key in attributes) {
            this.attribute += key+"="+attributes[key]+" ";
        }
    } else if(typeof attributes == "string") {
        this.attribute = attributes;
    }
}

Asset.prototype.toHTML = function(options) {
    options = options || {};
    options.prefix = options.prefix || "";
    switch(this.type) {
        case "js":
            return '<script '+this.attribute+' src="'+options.prefix+this.url+'" type="text/javascript"></script>';
        case "css":
            return '<link '+this.attribute+' href="'+options.prefix+this.url+'" rel="stylesheet"/>';
        case "less":
            return '<link '+this.attribute+' href="'+options.prefix+this.url+'" rel="stylesheet/less" type="text/css"/>';
    }
};

function assetGroupFilesToAssets(assetGroup) {
    return assetGroup.files.map(function(file) {
        return new Asset(path.join(assetGroup.route, file), assetGroup.type);
    });
}

function extension(filePath) {
    return filePath.split('.').pop();
}

function assetGroupToHTML(assetGroup, options) {
    var assetHtml = assetGroup.map(function(asset) {
        return asset.toHTML(options);
    }).join("\n");
    return '<!-- start asset "'+assetGroup.name+'" -->\n'+assetHtml+'\n<!-- end asset -->\n';
}

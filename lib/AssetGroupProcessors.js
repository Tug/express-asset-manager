var fs = require('fs');
var path = require('path');
var compressor = require('node-minify');
var requirejs = require('requirejs');
var less = require('less');
var AssetGroup = require('./AssetGroup');
var util = require('./util');

module.exports = function(options) {
    var hooks = {
        development: {
            default: function(assetGroup, callback) {
                callback && callback();
            },
            requirejs: function(assetGroup, callback) {
                // TODO: allow multiple modules (with config file?)
                var mainAsset = assetGroup.createAsset(assetGroup.config.main);
                assetGroup.assets = [
                    assetGroup.createAsset({
                        name        : assetGroup.config.lib,
                        attributes  : [{
                            "data-main": util.stripExtension(mainAsset.url)
                        }]
                    }),
                    assetGroup.createAsset(assetGroup.config.mainConfigFile)
                ];
                callback();
            },
            'requirejs-css': function(assetGroup, callback) {
                assetGroup.assets = [
                    assetGroup.createAsset(assetGroup.config.main)
                ];
                callback();
            },
            less: function(assetGroup, callback) {
                // TODO: do not reload less.js for each asset
                assetGroup.assets = [
                    assetGroup.createAsset({ name : assetGroup.config.main, type : "less" }),
                    assetGroup.createAsset({ name : assetGroup.config.lib, type : "js" })
                ];
                callback();
            }
        },
        production: {
            default: function(assetGroup, callback) {
                assetGroup.assets = [
                    assetGroup.createAsset({
                        srcDir: assetGroup.config.rootDir,
                        name: assetGroup.name
                    })
                ];
                callback && callback();
            },
            requirejs: function(assetGroup, callback) {
                util.createDirForFileSync(assetGroup.filepath);
                var mainAsset = assetGroup.createAsset(assetGroup.config.main);
                var libAsset = assetGroup.createAsset({
                    name        : assetGroup.config.lib,
                    attributes  : [{
                        "data-main": util.stripExtension(mainAsset.url)
                    }]
                });
                var config = {
                    baseUrl : assetGroup.srcDir,
                    name    : util.stripExtension(mainAsset.name),
                    out     : assetGroup.filepath
                };
                // optional parameters
                if(assetGroup.config.mainConfigFile) {
                    var mainConfigAsset = assetGroup.createAsset(assetGroup.config.mainConfigFile);
                    config.mainConfigFile = mainConfigAsset.filepath;
                } else {
                    config.mainConfigFile = mainAsset.filepath;
                }
                if(assetGroup.config.includeLib) {
                    // include require.js in the final asset
                    config.include = assetGroup.config.lib;
                    this.default(assetGroup, optimize);
                } else {
                    assetGroup.filepath = path.join(assetGroup.config.rootDir, assetGroup.config.lib);
                    assetGroup.assets = [ libAsset ];
                    // we could call this.js() but then the assetGroup.assets would be replaced in this.default()
                    util.createDirForFileSync(assetGroup.filepath);
                    new compressor.minify({
                        type        : options.compressors.js,
                        language    : 'ECMASCRIPT5',
                        fileIn      : assetGroup.assetsPaths(),
                        fileOut     : assetGroup.filepath,
                        buffer      : options.buffer,
                        callback    : optimize
                    });
                }
                function optimize(err) {
                    if(err) return callback(err);
                    requirejs.optimize(config, function(log) {
                        callback(null, log);
                    }, callback);
                }
            },
            js: function(assetGroup, callback) {
                util.createDirForFileSync(assetGroup.filepath);
                new compressor.minify({
                    type        : options.compressors.js,
                    language    : 'ECMASCRIPT5',
                    fileIn      : assetGroup.assetsPaths(),
                    fileOut     : assetGroup.filepath,
                    buffer      : options.buffer,
                    callback    : callback
                });
                this.default(assetGroup);
            },
            'requirejs-css': function(assetGroup, callback) {
                util.createDirForFileSync(assetGroup.filepath);
                var mainAsset = assetGroup.createAsset(assetGroup.config.main);
                requirejs.optimize({
                    baseUrl     : assetGroup.srcDir,
                    cssIn       : mainAsset.filepath,
                    out         : assetGroup.filepath,
                    optimizeCss : "standard"
                }, function(log) {
                    callback(null, log);
                }, callback);
                this.default(assetGroup);
            },
            css: function(assetGroup, callback) {
                util.createDirForFileSync(assetGroup.filepath);
                new compressor.minify({
                    type        : options.compressors.css,
                    fileIn      : assetGroup.assetsPaths(),
                    fileOut     : assetGroup.filepath,
                    buffer      : options.buffer,
                    callback    : callback
                });
                this.default(assetGroup);
            },
            less: function(assetGroup, callback) {
                util.createDirForFileSync(assetGroup.filepath);
                var mainAsset = assetGroup.createAsset(assetGroup.config.main);

                fs.readFile(mainAsset.filepath, 'utf8', function(err, fileContent) {
                    if(err) return callback(err);
                    var dataString = fileContent.toString();

                    var parser = new less.Parser({
                        paths         : [ assetGroup.srcDir ],
                        optimization  : 1,
                        filename      : assetGroup.filepath
                    });
                    parser.parse(dataString, function(err, cssTree) {
                        if(err) return callback(err);
                        var cssString = cssTree.toCSS({
                            compress   : true,
                            yuicompress: true
                        });
                        fs.writeFile(assetGroup.filepath, cssString, 'utf8',callback);
                    });
                });
                assetGroup.config.type = "css";
                this.default(assetGroup);
            }
        }
    };
    var processors = hooks[options.env];
    for(var p in processors) {
        processors[p] = processors[p].bind(processors);
    }
    return processors;
};


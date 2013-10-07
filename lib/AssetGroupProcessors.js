var fs = require('fs');
var path = require('path');
var compressor = require('node-minify');
var requirejs = require('requirejs');
var less = require('less');

module.exports = function(options) {
    var hooks = {
        development: {
            createAsset: function(assetGroup, fileInfo) {
                fileInfo.filepath = path.join(assetGroup.config.dir, fileInfo.name);
                return assetGroup.createDefaultAsset(fileInfo);
            },
            default: function(assetGroup, callback) {
                assetGroup.assets = assetGroup.config.files.map(this.createAsset.bind(this));
                callback && callback();
            },
            requirejs: function(assetGroup, callback) {
                // TODO: allow multiple modules (with config file?)
                assetGroup.assets = [
                    this.createAsset(assetGroup, {
                        name        : assetGroup.config.lib,
                        attributes  : {
                            "data-main": this.createAsset(assetGroup.config.main)
                        }
                    }),
                    this.createAsset(assetGroup, assetGroup.config.mainConfigFile)
                ];
                callback();
            },
            'requirejs-css': function(assetGroup, callback) {
                assetGroup.assets = [
                    this.createAsset(assetGroup, assetGroup.config.main)
                ];
                callback();
            },
            less: function(assetGroup, callback) {
                // TODO: do not reload less.js for each asset
                assetGroup.assets = [
                    this.createAsset(assetGroup, { name : assetGroup.config.main, type : "css" }),
                    this.createAsset(assetGroup, { name : assetGroup.config.lib, type : "js" })
                ];
                callback();
            }
        },
        production: {
            createAsset: function(assetGroup, fileInfo) {
                fileInfo.filepath = path.join(options.buildDir, fileInfo.name);
                return assetGroup.createDefaultAsset(fileInfo);
            },
            default: function(assetGroup, callback) {
                assetGroup.assets = [ this.createAsset(assetGroup, assetGroup) ];
                callback && callback();
            },
            requirejs: function(assetGroup, callback) {
                var config = {
                    baseUrl : assetGroup.config.dir,
                    name    : assetGroup.config.main,
                    out     : assetGroup.filepath
                };
                // optional parameters
                if(assetGroup.config.mainConfigFile) {
                    config.mainConfigFile = path.join(assetGroup.config.dir, assetGroup.config.mainConfigFile);
                }
                if(assetGroup.config.lib && assetGroup.config.includeLib === true) {
                    config.include = assetGroup.config.lib;
                    this.default(assetGroup);
                } else {
                    assetGroup.assets = [
                        this.createAsset(assetGroup, {
                            name        : assetGroup.config.lib,
                            attributes  : [{
                                "data-main": this.createAsset(assetGroup, {
                                    name : assetGroup.name,
                                    type : "js"
                                })
                            }]
                        })
                    ];
                }
                requirejs.optimize(config, function(log) {
                    callback(null, log);
                }, callback);
            },
            js: function(assetGroup, callback) {
                var dir = assetGroup.config.dir;
                new compressor.minify({
                    type        : options.compressors.js,
                    language    : 'ECMASCRIPT5',
                    fileIn      : assetGroup.config.files.map(function(file) {
                        return path.join(dir, file);
                    }),
                    fileOut     : assetGroup.filepath,
                    buffer      : options.buffer,
                    callback    : callback
                });
                this.default(assetGroup);
            },
            'requirejs-css': function(assetGroup, callback) {
                requirejs.optimize({
                    cssIn       : path.join(assetGroup.config.dir, assetGroup.config.main),
                    out         : assetGroup.filepath,
                    optimizeCss : "standard"
                }, function(log) {
                    callback(null, log);
                }, callback);
                this.default(assetGroup);
            },
            css: function(assetGroup, callback) {
                var dir = assetGroup.config.dir;
                new compressor.minify({
                    type        : options.compressors.css,
                    fileIn      : assetGroup.config.files.map(function(file) {
                        return path.join(dir, file);
                    }),
                    fileOut     : assetGroup.filepath,
                    buffer      : options.buffer,
                    callback    : callback
                });
                this.default(assetGroup);
            },
            less: function(assetGroup, callback) {
                var mainLessPath = path.join(assetGroup.config.dir, assetGroup.config.main);
                var outCssPath = assetGroup.filepath;

                fs.readFile(mainLessPath, 'utf8', function(err, fileContent) {
                    if(err) return callback(err);
                    var dataString = fileContent.toString();

                    var parser = new less.Parser({
                        paths         : [ assetGroup.config.dir ],
                        optimization  : 1
                    });
                    parser.parse(dataString, function(err, cssTree) {
                        if(err) return callback(err);
                        var cssString = cssTree.toCSS({
                            compress   : true,
                            yuicompress: true
                        });
                        // TODO: inline CSS imports
                        fs.writeFile(outCssPath, cssString, 'utf8', callback);
                    });
                });
                assetGroup.assets = [
                    this.createAsset(assetGroup, {
                        name    : assetGroup.name,
                        type    : "css"
                    })
                ];
            }
        }
    };
    var processors = hooks[options.env];
    for(var p in processors) {
        processors[p] = processors[p].bind(processors);
    }
    return processors;
};


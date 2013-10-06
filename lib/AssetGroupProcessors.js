var fs = require('fs');
var path = require('path');
var compressor = require('node-minify');
var requirejs = require('requirejs');
var less = require('less');

module.exports = function(options) {
    var hooks = {
        development: {
            createAsset: function(fileInfo) {
                fileInfo.filepath = path.join(this.config.dir, filePath);
                return this.createDefaultAsset(fileInfo);
            },
            default: function(callback) {
                this.assets = this.files.map(this.createAsset.bind(this));
                callback && callback();
            },
            requirejs: function(callback) {
                // TODO: allow multiple modules (with config file?)
                this.assets = [
                    this.createAsset({
                        name        : this.config.lib,
                        attributes  : {
                            "data-main": this.createAsset(this.config.main)
                        }
                    }),
                    this.createAsset(this.config.mainConfigFile)
                ];
                callback();
            },
            'requirejs-css': function(callback) {
                this.assets = [
                    this.createAsset(this.config.main)
                ];
                callback();
            },
            less: function(callback) {
                // TODO: do not reload less.js for each asset
                this.assets = [
                    this.createAsset({ name : this.config.main, type : "css" }),
                    this.createAsset({ name : this.config.lib, type : "js" })
                ];
                callback();
            }
        },
        production: {
            createAsset: function(fileInfo) {
                fileInfo.filepath = path.join(options.buildDir, filePath);
                return this.createDefaultAsset(fileInfo);
            },
            default: function(callback) {
                this.assets = [ this.createAsset(this.name) ];
                callback && callback();
            },
            requirejs: function(callback) {
                requirejs.optimize({
                    baseUrl         : this.config.dir,
                    name            : this.config.main,
                    mainConfigFile  : path.join(this.config.dir, this.mainConfigFile),
                    include         : this.config.lib,
                    out             : this.filepath
                }, function(log) {
                    callback(null, log);
                }, callback);
                this.assets = [
                    this.createAsset({
                        name        : this.config.lib,
                        attributes  : {
                            "data-main": this.createAsset({
                                name : this.name,
                                type : "js"
                            })
                        }
                    })
                ];
            },
            js: function(callback) {
                var dir = this.config.dir;
                new compressor.minify({
                    type        : options.compressors.js,
                    language    : 'ECMASCRIPT5',
                    fileIn      : this.files.map(function(file) {
                        return path.join(dir, file);
                    }),
                    fileOut     : this.filepath,
                    buffer      : options.buffer,
                    callback    : callback
                });
                this.all();
            },
            'requirejs-css': function(callback) {
                requirejs.optimize({
                    cssIn       : path.join(this.dir, this.main),
                    out         : this.filepath,
                    optimizeCss : "standard"
                }, function(log) {
                    callback(null, log);
                }, callback);
                this.all();
            },
            css: function(callback) {
                var dir = this.config.dir;
                new compressor.minify({
                    type        : options.compressors.css,
                    fileIn      : this.files.map(function(file) {
                        return path.join(dir, file);
                    }),
                    fileOut     : this.filepath,
                    buffer      : options.buffer,
                    callback    : callback
                });
                this.all();
            },
            less: function(callback) {
                var mainLessPath = path.join(this.dir, this.main);
                var outCssPath = this.filepath;

                fs.readFile(mainLessPath, 'utf8', function(err, fileContent) {
                    if(err) return callback(err);
                    var dataString = fileContent.toString();

                    var parser = new less.Parser({
                        paths         : [ this.dir ],
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
                this.all();
            }
        }
    };
    return hooks[options.env];
};


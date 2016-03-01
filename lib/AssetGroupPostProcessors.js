var fs = require('fs');
var path = require('path');
var glob = require('glob');
var util = require('./util');
var Step = require('step');
var debug = require('debug')('express-asset-manager');

module.exports = function(options) {

    var hooks = {
        development: {
            default: function(assetGroup, callback) {
                callback && callback();
            }
        },
        production: {
            default: function(assetGroup, callback) {
                if(assetGroup.config.fingerprint) {
                    var filedir = path.dirname(assetGroup.filepath);
                    var hash = util.hashFiles([ assetGroup.filepath ]);
                    var filename = path.basename(assetGroup.filepath);
                    var newFilename = hash + '-' + filename;
                    var newFilepath = path.join(filedir, newFilename);
                    Step(
                        function renameMainFile() {
                            var next = this;
                            debug("Renaming "+assetGroup.filepath+" into "+newFilepath);
                            fs.rename(assetGroup.filepath, newFilepath, next);
                        },
                        function listHelperFiles(err) {
                            var next = this;
                            if(err) return next(err);
                            glob(assetGroup.filepath + '.*', next);
                        },
                        function renameHelperFiles(err, files) {
                            var next = this;
                            if(err || !files || files.length === 0) return next(err);
                            var group = this.group();
                            files.forEach(function(file) {
                                var filename = path.basename(file);
                                var newFilename = hash + '-' + filename;
                                var newFilepath = path.join(filedir, newFilename);
                                debug("Renaming "+file+" into "+newFilepath);
                                fs.rename( file, newFilepath, group());
                            });
                        },
                        function updateAssetPath(err) {
                            var next = this;
                            if(err) return next(err);
                            assetGroup.assets = [
                                assetGroup.createAsset({
                                    srcDir: assetGroup.config.rootDir,
                                    name: newFilename
                                })
                            ];
                            next();
                        },
                        callback
                    );
                } else {
                    callback();
                }
            }
        }
    };
    var processors = hooks[options.env];
    for(var p in processors) {
        processors[p] = processors[p].bind(processors);
    }
    return processors;
};


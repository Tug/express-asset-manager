var fse = require('fs-extra');
var assert = require('assert');
var path = require('path');
var Step = require('step');
var debug = require('debug')('express-asset-manager');
var Asset = require('./Asset');
var AssetGroup = require('./AssetGroup');
var AssetGroupProcessors = require('./AssetGroupProcessors');
var util = require('./util');

function AssetManager(assetGroupsInfo, options) {
    this.assetGroupsInfo = assetGroupsInfo || {};
    this.options = options || {};
    options.env = options.env || process.env.NODE_ENV || "development";
    options.debug = (options.env === "development") ? true : !!options.debug;
    options.rootRoute = options.rootRoute || '/static';
    options.srcDir = options.srcDir || './public';
    options.buildDir = options.buildDir || './builtAssets';
    options.rootDir = {
        development: options.srcDir,
        production: options.buildDir
    };
    options.compressors = options.compressors || {};
    options.compressors.js = options.compressors.js || 'gcc';
    options.compressors.css = options.compressors.css || 'sqwish';
    options.buffer = options.buffer || (8 * 1024 * 1024); // default: 8 MB
    options.process = options.process !== undefined ? options.process : true; // default: true
    options.requirejs = options.requirejs || {};
    options.requirejs.pragmas = options.requirejs.pragmas || { build: true };
    options.assertAssets = options.assertAssets !== undefined ? options.assertAssets : true; // default: true
    options.copy = options.copy || [];
    options.fingerprint = options.fingerprint || false;
    this.assetGroups = {};
    this.processors = AssetGroupProcessors(this.options);
}

AssetManager.prototype.run = function(callback) {

    var self = this;
    Step(function() {
        self.copy(this);
    },function(err) {
        if(err) this(err);
        self.createAssetGroups(this);
    }, callback);

};

AssetManager.prototype.createAssetGroups = function(callback) {

    var self = this;
    var assetGroupsInfo = this.assetGroupsInfo;
    var assetGroups = this.assetGroups;

    Step(function() {

        var group = this.group();

        for(var name in assetGroupsInfo) {

            var assetGroup = self.createAssetGroup(name, assetGroupsInfo[name]);

            debug("Asset : "+name, assetGroup);

            if(self.options.assertAssets) {
                try {
                    self.assertAssetGroup(assetGroup);
                } catch(e) {
                    group()(e);
                    continue;
                }
            }

            self.processAssetGroup(assetGroup, group());

            assetGroups[name] = assetGroup;
        }

    }, callback);

};

AssetManager.prototype.processAssetGroup = function(assetGroup, callback) {

    var processors = this.processors;
    var start = Date.now();
    (processors[assetGroup.config.type] || processors.default)(assetGroup, function(err) {
        var duration = Date.now() - start;
        debug("Asset "+assetGroup.name+" processed in "+duration+"ms");
        callback(err);
    });

};

AssetManager.prototype.copy = function(callback) {

    var options = this.options;
    if(!options.process) return callback();

    Step(function() {

        var group = this.group();

        options.copy.forEach(function(fileOrDir) {
            var src = path.join(options.srcDir, fileOrDir);
            var dst = path.join(options.buildDir, fileOrDir);
            fse.copy(src, dst, group());
        });

    }, function(errors) {
        // fail silently here as errors will exist when multiple processes run this at the same time
        if(errors && errors.length > 0) {
            errors.forEach(function(err) {
                err && debug(err);
            });
        }
        callback();
    });

};

AssetManager.prototype.createAssetGroup = function(name, assetGroupInfo) {
    // Do not modify source assetGroupInfo object
    var info = {
        name            : name,
        main            : assetGroupInfo.main,
        lib             : assetGroupInfo.lib,
        env             : assetGroupInfo.env,
        include         : assetGroupInfo.include,
        includeLib      : assetGroupInfo.includeLib,
        mainConfigFile  : assetGroupInfo.mainConfigFile,
        loaderPluginExtensionMaps: assetGroupInfo.loaderPluginExtensionMaps,
        attributes      : assetGroupInfo.attributes,
        options         : assetGroupInfo.options
    };
    info.type       = assetGroupInfo.type || assetGroupInfo.name.split('.').pop();
    info.dir        = assetGroupInfo.dir || info.type;
    info.srcDir     = path.join(this.options.srcDir, assetGroupInfo.srcDir || info.dir);
    info.rootDir    = path.join(this.options.rootDir[this.options.env], assetGroupInfo.rootDir || info.dir);
    info.route      = util.routeJoin(this.options.rootRoute, assetGroupInfo.route || info.dir);
    info.process    = assetGroupInfo.process !== undefined ? assetGroupInfo.process : this.options.process;
    info.files      = util.deGlobFiles(assetGroupInfo.files || [], info.srcDir);
    info.fingerprint= assetGroupInfo.fingerprint !== undefined ? assetGroupInfo.fingerprint : this.options.fingerprint;
    info.generateSourceMaps = assetGroupInfo.generateSourceMaps !== undefined ? assetGroupInfo.generateSourceMaps : this.options.generateSourceMaps;
    return new AssetGroup(info);
};

AssetManager.prototype.assertAssetGroup = function(assetGroup) {
    switch(assetGroup.type) {
        case "requirejs":
        case "requirejs-css":
        case "less":
            assert(assetGroup.config.main != null, getMissingParameterErrorMessage(assetGroup, "main"));
            break;
    }
    switch(this.options.env) {
        case "development":
            switch(assetGroup.type) {
                case "less":
                    assert(assetGroup.config.lib != null, getMissingParameterErrorMessage(assetGroup, "lib"));
                    break;
            }
            break;
        case "production":
            break;
    }
};

function getMissingParameterErrorMessage(assetGroup, param) {
    return "Config parameter `"+param+"` expected for asset `"+assetGroup.name+"`";
}

module.exports = AssetManager;

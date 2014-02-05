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
    options.assertAssets = options.assertAssets !== undefined ? options.assertAssets : true; // default: true
    options.copy = options.copy || [];
    this.assetGroups = {};
    this.processors = AssetGroupProcessors(this.options);
}

AssetManager.prototype.run = function(callback) {

    var manager = this;

    Step(function() {
        manager.copy(this);
    },function(err) {
        if(err) this(err);
        manager.createAssetGroups(this);
    }, callback);

};

AssetManager.prototype.createAssetGroups = function(callback) {

    var manager = this;
    var assetGroupsInfo = this.assetGroupsInfo;
    var assetGroups = this.assetGroups;
    var processors = this.processors;

    Step(function() {

        var group = this.group();

        for(var name in assetGroupsInfo) {

            var assetGroup = manager.createAssetGroup(name, assetGroupsInfo[name]);

            debug("Asset : "+name, assetGroup);

            if(manager.options.assertAssets) {
                try {
                    manager.assertAssetGroup(assetGroup);
                } catch(e) {
                    group()(e);
                    continue;
                }
            }

            (processors[assetGroup.config.type] || processors.default)(assetGroup, group());

            assetGroups[name] = assetGroup;
        }

    }, callback);

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

    }, callback);

};

AssetManager.prototype.createAssetGroup = function(name, assetGroupInfo) {
    assetGroupInfo.name = name;
    assetGroupInfo.type = assetGroupInfo.type || assetGroupInfo.name.split('.').pop();
    assetGroupInfo.dir = assetGroupInfo.dir || assetGroupInfo.type;
    assetGroupInfo.srcDir = path.join(this.options.srcDir, assetGroupInfo.dir);
    assetGroupInfo.rootDir = path.join(this.options.rootDir[this.options.env], assetGroupInfo.dir);
    assetGroupInfo.route = util.routeJoin(this.options.rootRoute, assetGroupInfo.route || assetGroupInfo.dir);
    assetGroupInfo.process = this.options.process;
    return new AssetGroup(assetGroupInfo);
}

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
}

function getMissingParameterErrorMessage(assetGroup, param) {
    return "Config parameter `"+param+"` expected for asset `"+assetGroup.name+"`";
}

module.exports = AssetManager;

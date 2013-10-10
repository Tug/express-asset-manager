var fs = require('fs');
var assert = require('assert');
var path = require('path');
var Step = require('step');
var debug = require('debug')('express-asset-manager');
var Asset = require('./Asset');
var AssetGroup = require('./AssetGroup');
var AssetGroupProcessors = require('./AssetGroupProcessors');

function AssetManager(options) {
    this.options = options || {};
    options.env = options.env || process.env.NODE_ENV || "development";
    options.compressors = options.compressors || {};
    options.compressors.js = options.compressors.js || 'gcc';
    options.compressors.css = options.compressors.css || 'sqwish';
    options.buildDir = options.buildDir || './builtAssets';
    options.buffer = options.buffer || (8 * 1024 * 1024);
    options.process = !!options.process;
    options.assertAssets = options.assertAssets || true;
    this.processors = AssetGroupProcessors(this.options);
}

AssetManager.prototype.createAssetGroups = function(assetGroupsInfo, callback) {

    var manager = this;
    var assetGroups = [];
    var processors = this.processors;

    Step(function() {

        var group = this.group();

        for(var name in assetGroupsInfo) {
            var assetGroupInfo = assetGroupsInfo[name];

            assetGroupInfo.filepath = path.join(manager.options.buildDir, name);
            assetGroupInfo.url = path.join(assetGroupInfo.route, name).replace(/\\/, '/');

            var assetGroup = new AssetGroup(name, assetGroupInfo);

            debug("Asset : "+name, assetGroup);

            if(manager.options.assertAssets) {
                try {
                    manager.assertAssetGroup(assetGroup);
                } catch(e) {
                    group()(e);
                    continue;
                }
            }

            (processors[assetGroup.type] || processors.default)(assetGroup, group());

            assetGroups[name] = assetGroup;
        }

    }, callback);

    return assetGroups;

};

AssetManager.prototype.assertAssetGroup = function(assetGroup) {
    assert(assetGroup.type != null, getMissingParameterErrorMessage(assetGroup, "type"));
    assert(assetGroup.config.route != null, getMissingParameterErrorMessage(assetGroup, "route"));
    assert(assetGroup.config.dir != null, getMissingParameterErrorMessage(assetGroup, "dir"));
    this.assetGroupTypeAssert(assetGroup);
}

AssetManager.prototype.assetGroupTypeAssert = function(assetGroup) {
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
                case "requirejs":
                    assert(assetGroup.config.mainConfigFile != null, getMissingParameterErrorMessage(assetGroup, "mainConfigFile"));
                case "less":
                case "requirejs-css":
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

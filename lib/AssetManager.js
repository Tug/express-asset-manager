var fs = require('fs');
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
            assetGroupInfo.url = path.join(assetGroupInfo.route, name);

            var assetGroup = new AssetGroup(name, assetGroupInfo);

            debug("Asset : "+name, assetGroup);

            (processors[assetGroup.type] || processors.default)(assetGroup, group());

            assetGroups[name] = assetGroup;
        }

    }, callback);

    return assetGroups;

};

function mixin(receiver, supplier) {
    Object.keys(supplier).forEach(function(property) {
        Object.defineProperty(receiver, property, Object.getOwnPropertyDescriptor(supplier, property));
    });
}

module.exports = AssetManager;

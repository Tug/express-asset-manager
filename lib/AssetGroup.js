var Asset = require('./Asset');
var path = require('path');
var util = require('./util');

/**
 * An asset group represents a group of assets.
 * - assetGroupInfo can give a collection of `files` or just a `main` file
 * - An asset group is an asset so it must have a type, `assetGroupInfo.type`
 * - Its url is constructed from `assetGroupInfo.name` and from the buildDir in production
 *   In development we don't use the url property of the asset but rather the ones of the children assets
 * - its filepath only makes sense when used in production
 */
function AssetGroup(assetGroupInfo) {
    Asset.call(this, assetGroupInfo);
    this.config = (typeof assetGroupInfo === "object") ? assetGroupInfo : {};
    this.config.files = this.config.files || [];
    this.assets = assetGroupInfo.assets || this.config.files.map(this.createAsset.bind(this));
    this.filepath = path.join(this.config.rootDir, this.name);
}

AssetGroup.prototype = Object.create(Asset.prototype);

AssetGroup.prototype.createAsset = function(fileInfo) {
    if(typeof fileInfo === "string") {
        fileInfo = { name: fileInfo };
    }
    fileInfo.srcDir = this.config.srcDir;
    fileInfo.route = fileInfo.route || this.config.route;
    fileInfo.type = fileInfo.type || this.config.type;
    fileInfo.attributes = fileInfo.attributes || this.config.attributes;
    var asset = new Asset(fileInfo);
    return asset;
};

AssetGroup.prototype.assetsPaths = function() {
    return this.assets.map(function(asset) {
        return asset.filepath;
    });
};

AssetGroup.prototype.toHTML = function() {
    var self = this;
    self.assets.toString();
    return this.assets.map(function(asset) {
        return asset.toHTML();
    }).join("\n");
};

module.exports = AssetGroup;

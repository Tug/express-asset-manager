var Asset = require('./Asset');
var path = require('path');

/**
 * An asset group represents a group of assets.
 * - assetGroupInfo can give a collection of `files` or just a `main` file
 * - An asset group is an asset so it must have a type, `assetGroupInfo.type`
 * - Its url is constructed from `assetGroupInfo.name` and from the buildDir in production
 *   In development we don't use the url property of the asset but rather the ones of the children assets
 * - its filepath only makes sense when used in production
 */
function AssetGroup(name, assetGroupInfo) {
    Asset.call(this, assetGroupInfo);
    this.name = name;
    this.config = assetGroupInfo || {};
    this.config.dir = this.config.dir || "";
    this.config.files = this.config.files || [];
    this.assets = [];
}

AssetGroup.prototype = Object.create(Asset.prototype);

AssetGroup.prototype.createDefaultAsset = function(fileInfo) {
    var filePath;
    if(typeof fileInfo === "object") {
        filePath = fileInfo.name;
    } else {
        filePath = fileInfo;
        fileInfo = {};
    }
    fileInfo.url = path.join(fileInfo.route || this.config.route, filePath || this.filepath).replace(/\\/, '/');
    fileInfo.type =  fileInfo.type || this.config.type;
    var asset = new Asset(fileInfo);
    return asset;
};

AssetGroup.prototype.generateHTML = function(options) {
    var assetHtml = this.assets.map(function(asset) {
        return asset.toHTML(options);
    }).join("\n");
    return [
        '<!-- start asset "'+this.name+'" -->',
        assetHtml,
        '<!-- end asset -->'
    ].join('\n');
};

module.exports = AssetGroup;

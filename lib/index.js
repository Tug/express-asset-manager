var debug = require('debug')('express-asset-manager');
var Asset = require('./Asset');
var AssetManager = require('./AssetManager');

module.exports = function(assetGroupsInfo, options, callback) {

    if(typeof options === "function") {
        callback = options;
        options = {};
    }
    options = options || {};
    options.debug = !!options.debug;

    var manager = new AssetManager(options);

    var assetGroups = manager.createAssetGroups(assetGroupsInfo, function(err) {
        if(err && options.debug) console.log(err);
        callback && callback(err);
    });

    return function(req, res, next) {
        res.locals.asset = function(name, options) {
            var assetGroup = assetGroups[name];
            if(assetGroup !== undefined) {
                return assetGroup.toHTML(options);
            } else {
                return new Asset(name).toHTML(options);
            }
        };
        next();
    };

};

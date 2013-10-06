var debug = require('debug')('express-asset-manager');
var Asset = require('./Asset');
var AssetManager = require('./AssetManager');

module.exports = function(assetGroupsInfo, options, callback) {

    options = options || {};
    options.debug = !!options.debug;
    if(options.debug) debug = console.log.bind(console);

    var manager = new AssetManager(options);

    var assetGroups = manager.createAssetGroups(assetGroupsInfo, function(err) {
        if(err && options.debug) debug(err);
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

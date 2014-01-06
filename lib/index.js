var debug = require('debug')('express-asset-manager');
var Asset = require('./Asset');
var AssetManager = require('./AssetManager');

module.exports = function(assetGroupsInfo, options, callback) {

    if(typeof options === "function") {
        callback = options;
        options = {};
    }

    var manager = new AssetManager(assetGroupsInfo, options);
    var cache = {};

    manager.run(function(err) {
        if(err && options.debug) console.log(err.stack || err);

        for(var assetName in manager.assetGroups) {
            cache[assetName] = manager.assetGroups[assetName].toHTML();
        }

        callback && callback(err);
    });

    return function(req, res, next) {
        res.locals.asset = function(name, options) {
            var assetGroupHTML = cache[name];
            if(assetGroupHTML !== undefined) {
                return assetGroupHTML;
            } else {
                return new Asset(name).toHTML();
            }
        };
        res.locals.asset.manager = manager;
        if(next) next();
    };

};


var requirejs = require('requirejs');

module.exports = function (config, assetGroup, callback) {
    requirejs.optimize(config, function(log) {
        callback(null, log);
    }, callback);
};
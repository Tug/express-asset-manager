
var path = require('path');

var workerFarm = require('worker-farm');


module.exports = function(options) {
    options = options || {};
    var workerPool = workerFarm({
        maxConcurrentWorkers: options.poolSize || require('os').cpus().length-1 || 1
    }, require.resolve('./worker'));

    return {
        optimize: function(config, assetGroup, callback) {
            workerPool(config, assetGroup, callback);
        },
        shutdown: function() {
            workerFarm.end(workerPool);
        }
    };

};

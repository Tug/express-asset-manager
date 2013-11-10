var url = require('url');
var path = require('path');
var fse = require('fs-extra');

module.exports = {
    routeJoin : function(from) {
        from = from || "";
        from = (from.indexOf("/", from.length - 1) === -1) ? from + "/" : from;
        var args = Array.prototype.slice.call(arguments, 1).map(function(arg) { return arg || ""; });
        var route = path.join.apply(path, args).replace(/\\/, '/');
        return url.resolve(from, route);
    },
    stripExtension: function(url) {
        return url.replace(/\.[^/.]+$/, "");
    },
    createDirForFileSync: function(file) {
        var directory = path.dirname(file);
        fse.mkdirpSync(directory);
    },
    merge: function(obj1, obj2) {
        for(var p in obj2) {
            obj1[p] = obj2[p];
        }
        return obj1;
    }
}
var url = require('url');
var path = require('path');
var fse = require('fs-extra');
var glob = require('glob');
var crypto = require('crypto');
var fs = require('fs');

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
    },
    deGlobFiles: function(files, dir) {
        var filesOut = [];
        files.forEach(function(file) {
            filesOut = filesOut.concat(glob.sync(file, { cwd: dir }));
        });
        return this.distinct(filesOut);
    },
    distinct: function(items) {
        var derivedArray = [];
        for (var i = 0, len = items.length; i < len; i++) {
            var current = items[i];
            if (derivedArray.indexOf(current) == -1) {
                derivedArray.push(current)
            }
        }
        return derivedArray;
    },
    hashFiles: function(files, algorithm, encoding, outputEncoding) {
        algorithm = algorithm || 'md5';
        encoding = encoding || 'utf8';
        outputEncoding = outputEncoding || 'hex';
        var hash = crypto.createHash(algorithm || 'md5');
        if(files) {
            if(!Array.isArray(files)) files = [ files ];
            files.forEach(function(file) {
                var out = fs.readFileSync(file, encoding);
                hash.update(out.toString(), encoding)
            });
        }
        return hash.digest(outputEncoding);
    }
};
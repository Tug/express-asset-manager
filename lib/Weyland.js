
var path = require('path');
var SandboxedModule = require('sandboxed-module');
var util = require('./util');

function readRequireJSConfigFile(filename) {
    var config;
    var context = {};
    var doNothing = function() {};
    context.requirejs = doNothing;
    context.require = doNothing;
    context.define = doNothing;
    context.requirejs.config = function(configObj) {
        context.$_config = configObj;
    };
    SandboxedModule.load(path.resolve(filename), { globals: context });
    return context.$_config;
}

function sortPaths(original) {
    if(!original){
        return [];
    }

    var final = [];

    for(var key in original){
        final.push({
            key:key,
            path:original[key]
        });
    }

    final.sort(function(a, b){
        return b.path.length - a.path.length; // ASC -> a - b; DESC -> b - a
    });

    return final;
}

module.exports = {

    rjs: function(assetGroup) {
        var rjsIncludes = [];
        if (!assetGroup.config.mainConfigFile) return rjsIncludes;
        var configFile = path.join(assetGroup.config.srcDir, assetGroup.config.mainConfigFile);
        var configFileContent = readRequireJSConfigFile(configFile);
        var files = util.deGlobFiles(assetGroup.config.include || [], assetGroup.config.srcDir);

        var paths = sortPaths(configFileContent.paths || {});

        for(var i = 0, len = files.length; i < len; i++){
            var current = files[i];

            current = current.replace(/\\/g, '/');

            for(var j = 0, len2 = paths.length; j < len2; j++){
                var value = paths[j];
                if(current.indexOf(value.path) == 0){
                    current = current.replace(value.path, value.key);
                    break;
                }
            }

            for(var extension in assetGroup.config.loaderPluginExtensionMaps) {
                if(current.indexOf(extension, current.length - extension.length) !== -1) {
                    current = assetGroup.config.loaderPluginExtensionMaps[extension] + '!' + current;
                } else {
                    current = current.replace('.js', '');
                }
            }

            rjsIncludes.push(current);
        }

        return rjsIncludes;
    }
};

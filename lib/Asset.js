var url = require('url');
var path = require("path");
var util = require('./util');

function Asset(assetInfo) {
    if(typeof assetInfo === "string") {
        assetInfo = { name: assetInfo };
    }
    if(assetInfo.name) {
        this.name       = assetInfo.name;
        this.srcDir     = assetInfo.srcDir      || "";
        this.rootDir    = assetInfo.rootDir     || "";
        this.filepath   = assetInfo.filepath    || path.join(this.srcDir, this.name);
        this.url        = assetInfo.url         || util.routeJoin(assetInfo.route || "", this.name);
        this.type       = assetInfo.type        || this.name.split('.').pop();
    } else {
        this.type       = assetInfo.type;
        this.content    = assetInfo.content;
    }
    this.attributes = assetInfo.attributes  || [];
    if(this.attributes.constructor !== Array) {
        var self = this;
        this.attributes = Object.keys(this.attributes).map(function(key) {
            var attribute = {};
            attribute[key] = self.attributes[key];
            return attribute;
        });
    }
    this.attributeStr = this.attributes.map(function(attribute) {
        if(typeof attribute === "object") {
            var attStr = "";
            for(var key in attribute) {
                attStr += key + '="' + attribute[key].toString() + '" ';
            }
            return attStr;
        } else {
            return attribute.toString();
        }
    }).join(" ");
}

Asset.prototype.toHTML = function(options) {
    options = options || {};
    if(!this.content) {
        var url = customURL(this.url, options);
        var attribute = customAttribute(this.attributeStr, options);
        switch(this.type) {
            case "css":
            case "requirejs-css":
                return '<link '+attribute+' href="'+url+'" rel="stylesheet" type="text/css"/>';
            case "less":
                return '<link '+attribute+' href="'+url+'" rel="stylesheet/less" type="text/css"/>';
            case "js":
            case "requirejs":
            default:
                return '<script '+attribute+' src="'+url+'" type="text/javascript"></script>';
        }
    } else {
        switch(this.type) {
            case "css":
            case "requirejs-css":
                return '<style type="text/css">'+this.content+'</style>';
            case "less":
                return '<style type="text/less">'+this.content+'</style>';
            case "js":
            case "requirejs":
            default:
                return '<script type="text/javascript">'+this.content+'</script>';
        }
    }
};

function customURL(url, options) {
    url = url || '';
    if(options.prefix !== undefined) {
        url = options.prefix + url;
    }
    if(options.suffix !== undefined) {
        url += options.suffix;
    }
    return url;
}

function customAttribute(str, options) {
    str = str || '';
    if(options.attribute !== undefined) {
        str += ' ' + options.attribute;
    }
    return str;
}

module.exports = Asset;

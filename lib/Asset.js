var url = require('url');
var path = require("path");
var util = require('./util');

function Asset(assetInfo) {
    if(typeof assetInfo === "string") {
        assetInfo = { name: assetInfo };
    }
    this.name       = assetInfo.name;
    this.srcDir     = assetInfo.srcDir      || "";
    this.rootDir    = assetInfo.rootDir     || "";
    this.filepath   = assetInfo.filepath    || path.join(this.srcDir, this.name);
    this.url        = assetInfo.url         || util.routeJoin(assetInfo.route || "", this.name);
    this.type       = assetInfo.type        || this.name.split('.').pop();
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

Asset.prototype.toHTML = function() {
    switch(this.type) {
        case "css":
        case "requirejs-css":
            return '<link '+this.attributeStr+' href="'+this.url+'" rel="stylesheet" type="text/css"/>';
        case "less":
            return '<link '+this.attributeStr+' href="'+this.url+'" rel="stylesheet/less" type="text/css"/>';
        case "js":
        case "requirejs":
        default:
            return '<script '+this.attributeStr+' src="'+this.url+'" type="text/javascript"></script>';
    }
};

module.exports = Asset;

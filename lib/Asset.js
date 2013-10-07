var url = require('url');

function Asset(assetInfo) {
    if(typeof assetInfo === "string") {
        assetInfo = { url: assetInfo };
    }
    this.url = assetInfo.url;
    this.type = assetInfo.type || this.url.split('.').pop();
    this.attributes = assetInfo.attributes || [];
    this.filepath = assetInfo.filepath;
}

Asset.prototype.generateHTML = function(options) {
    options = options || {};
    var url = customURL(this.url, options);
    var attribute = this.attributes.map(function(attribute) {
        if(typeof attribute === "object") {
            var attStr = "";
            for(var key in attribute) {
                var attValue = attribute[key];
                if(attValue instanceof Asset) {
                    attValue = customURL(attValue.toString(), options);
                }
                attStr += key + '="' + attValue + '" ';
            }
            return attStr;
        } else {
            return attribute.toString();
        }
    }).join(" ");
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
};

function customURL(urlStr, options) {
    if(options.prefix !== undefined) {
        return url.resolve(options.prefix, urlStr);
    }
    return urlStr;
}

Asset.prototype.toString = function() {
    return this.url;
}

Asset.prototype.toHTML = function(options) {
    if(options === undefined && this.cacheHTML !== undefined) {
        return this.cacheHTML;
    }
    var html = this.generateHTML(options);
    if(options === undefined) {
        this.cacheHTML = html;
    }
    return html;
};

module.exports = Asset;

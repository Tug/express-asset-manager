
function Asset(assetInfo) {
    this.url = assetInfo.url;
    this.type = assetInfo.type || this.url.split('.').pop();
    this.attributes = assetInfo.attributes || [];
    this.filepath = assetInfo.filepath;
}

Asset.prototype.toHTML = function(options) {
    options = options || {};
    var url = customURL(this.url, options);
    var attribute = this.attributes.map(function(attribute) {
        if(typeof attribute === "object") {
            var attStr = "";
            for(var key in attribute) {
                var attUrl = customURL(attribute[key].toString(), options);
                attStr += key + '="' + attUrl + '" ';
            }
            return attStr;
        } else {
            return attribute.toString();
        }
    }).join(" ");
    switch(this.type) {
        case "css":
        case "requirejs-css":
            return '<link '+attribute+' href="'+url+'" rel="stylesheet"/>';
        case "less":
            return '<link '+attribute+' href="'+url+'" rel="stylesheet/less" type="text/css"/>';
        case "js":
        case "requirejs":
        default:
            return '<script '+attribute+' src="'+url+'" type="text/javascript"></script>';
    }
};

function customURL(url, options) {
    if(options.prefix !== undefined) {
        return path.join(options.prefix, url);
    }
    return url;
}

Asset.prototype.toString = function() {
    return this.url;
}

Asset.prototype.toHTML = function(options) {
    if(options === undefined && this.cacheHTML !== undefined) {
        return this.cacheHTML;
    }
    var html = this.toHTML();
    if(options === undefined) {
        this.cacheHTML = html;
    }
    return html;
};

module.exports = Asset;

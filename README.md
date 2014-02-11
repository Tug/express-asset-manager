express-asset-manager
=============

Simple and easy to integrate asset manager for Express.js applications

## Installation


    npm install express-asset-manager



## Features :

- Transparent asset management.
    - In development, each ressources are loaded by default.
    - In production, ressources are grouped and minified.
- Group JavaScript and CSS files with [node-minify](https://github.com/srod/node-minify)
- AMD support with [require.js](http://requirejs.org)
- [Less](http://lesscss.org) support

|                         | Development   | Production   |
| ----------------------- |:-------------:|:------------:|
| JS (default)            | Yes           | Yes          |
| JS with AMD             | Yes           | Yes          |
| CSS (default)           | Yes           | Yes          |
| CSS with @import        | Yes           | Yes          |
| Less                    | Yes           | Yes          |
| Less with @import       | Yes           | Yes          |
| CoffeeScript            | Not yet       | Not yet      |


### JS (default)
```js
{
    "app.js" : {
        type: "js",
        dir: "js",
        files: [
            "../lib/jquery-1.9.1.js",
            "../lib/jquery.eventemitter.js",
            "../lib/knockout-2.2.1.js",
            "app.js",
            "models/User.js",
            "controllers/user.js",
        ]
    }
}
```

### JS with AMD
```js
{
    "app.js" : {
        type: "js",
        dir: "js",
        main: "app.js",
        lib: "../lib/require.js",
        mainConfigFile: "config.js", // optional, relative to `dir`
        includeLib: true // optional, default: false, include requirejs in the processed file 
    }
}
```

### CSS (default)
```js
{
    "style.css" : {
        type: "css",
        dir: "css",
        files: [
            "bootstrap.min.css",
            "bootstrap-responsive.min.css",
            "style.css",
            "style-responsive.css"
        ]
    }
}
```

### CSS with @import
```js
{
    "style.css" : {
        type: "css",
        dir: "css",
        main: "style.css"
    }
}
```

It uses requirejs to inline in production.


### Less and Less with @import
```js
{
    "style.css" : {
        type: "less",
        dir: "less",
        main: "style.less",
        lib: "../lib/less.js" // path to `less.js` to parse .less assets in the browser in dev env
    }
}
```

You need to write `@import (inline)` to inline CSS files in production.


    
## Exemple of usage
```js
var assets = {
    "app.js" : {
        type: "js",
        dir: "js",
        main: "app.js",
        lib: "../lib/require.js"
    },
    "style.css" : {
        type: "less",
        dir: "less",
        main: "style.less",
        lib: "../lib/less.js"
    }
};
var assetManagerConfig = {
    rootRoute   : "/static",
    srcDir      : "./public",
    buildDir    : "./builtAssets",
    process     : "true"
};
app.use(require("express-asset-manager")(assets, assetManagerConfig));

app.configure('development', function() {
    app.use(express.static('/static', './public'));
});

// in production, use a reverse proxy instead
app.configure('production', function() {
    app.use(express.static('/static', './builtAssets'));
});
```

   
In your views :
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <%- asset("style.css") %>
</head>
<body>
    <%-body -%>
    <%- asset("app.js") %>
</body>
```

Resulting page in development :
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <link href="/static/less/style.less" rel="stylesheet/less" type="text/css"/>
    <script src="/static/lib/less.js" type="text/javascript"></script>
</head>
<body>
    <%-body -%>
    <script src="/static/lib/require.js" data-main="/static/js/app" type="text/javascript"></script>
</body>
```


Resulting page in production :
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <link href="/static/less/style.css" type="text/css"/>
</head>
<body>
    <%-body -%>
    <script src="/static/lib/require.js" data-main="/static/js/app" type="text/javascript"></script>
</body>
```

At application startup, `./public/js/app.js` will be read and processed by require.js optimizer.
Output is saved in `./builtAssets/js/app.js`.

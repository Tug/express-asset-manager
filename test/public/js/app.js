requirejs.config({
    baseUrl: '/static/js',
    paths: {
        'jquery': '../lib/jquery.test'
    }
});

require(['./controllers/test'], function(test){
    test.jQueryVersion();
});

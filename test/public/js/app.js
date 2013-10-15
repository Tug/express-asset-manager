requirejs.config({
    baseUrl: '.',
    paths: {
        'jquery': '../lib/jquery.test'
    }
});

require(['./controllers/test'], function(test){
    test.jQueryVersion();
});

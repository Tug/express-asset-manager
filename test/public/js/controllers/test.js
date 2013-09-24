define(['jquery'], function($, require, exports, module) {
    return {
        jQueryVersion: function() {
            return $.fn.jquery;
        }
    };
});
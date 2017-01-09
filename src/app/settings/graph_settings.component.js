'use strict';

/*global angular*/

angular.module('app').component('graphSettings', {
    bindings: {
        settings: '<',
        onChange: '&'
    },
    controller: function(dataService) {
        var _this = this;

        _this.nodeSizes = dataService.NODE_SIZES;
        _this.fontSizes = dataService.FONT_SIZES;
    },
    templateUrl: 'app/settings/graph_settings.component.html'
});

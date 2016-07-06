'use strict';

/*global angular*/

angular.module('app').component('settings', {
    bindings: {
        nodeSize: '<',
        fontSize: '<',
        onChange: '&'
    },
    controller: function() {
        var ctrl = this;

        ctrl.nodeSizes = {
            Small: 50,
            Large: 100
        };

        ctrl.fontSizes = {
            Small: 12,
            Large: 18
        };
    },
    templateUrl: 'scripts/settings.component.html'
});
'use strict';

/*global angular*/

angular.module('app').component('test', {
    bindings: {},
    controller: function(dataService) {
        var ctrl = this;

        ctrl.stations = {};
        ctrl.deliveries = {};

        dataService.getData().then(function(data) {
            ctrl.stations = data.stations;
            ctrl.deliveries = data.deliveries;
        });
    },
    templateUrl: 'app/test.component.html'
});

'use strict';

/*global angular*/

angular.module('app').component('test', {
    bindings: {},
    controller: function(dataProvider) {
        var ctrl = this;

        ctrl.stations = {};
        ctrl.deliveries = {};

        dataProvider.get(function(data) {
            ctrl.stations = data.stations;
            ctrl.deliveries = data.deliveries;
        });
    },
    templateUrl: 'app/test.component.html'
});
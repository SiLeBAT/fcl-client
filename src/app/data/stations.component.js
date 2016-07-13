'use strict';

/*global angular*/

angular.module('app').component('stations', {
    bindings: {},
    controller: function(dataService) {
        var ctrl = this;

        ctrl.stations = {};
        ctrl.deliveries = {};

        dataService.getData().then(function(data) {
            ctrl.stations = data.stations;
            ctrl.deliveries = data.deliveries;
        });
        
        ctrl.order = "data.id";
    },
    templateUrl: 'app/data/stations.component.html'
});

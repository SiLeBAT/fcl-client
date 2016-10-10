'use strict';

/*global angular*/

angular.module('app').component('stations', {
    controller: function(dataService) {
        var ctrl = this;

        ctrl.stations = [];
        ctrl.order = "data.id";

        dataService.getData().then(function(data) {
            ctrl.stations = data.stations;
        });
    },
    templateUrl: 'app/data/stations.component.html'
});

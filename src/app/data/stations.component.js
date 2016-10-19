'use strict';

/*global angular*/

angular.module('app').component('stations', {
    controller: function(dataService) {
        var ctrl = this;
        var allStations = [];
        var getFilteredStations = function() {
            return ctrl.showTraceOnly ? allStations.filter(ctrl.isOnTrace) : allStations;
        };

        ctrl.stations = getFilteredStations();
        ctrl.order = "data.id";
        ctrl.showTraceOnly = dataService.getShowTraceOnly();

        ctrl.isOnTrace = function(station) {
            return station.data.forward || station.data.backward;
        };

        ctrl.onChange = function(property, value) {
            switch (property) {
                case "showTraceOnly":
                    ctrl.showTraceOnly = value;
                    dataService.setShowTraceOnly(value);
                    ctrl.stations = getFilteredStations();
                    break;
            }
        };

        dataService.getData().then(function(data) {
            allStations = data.stations;
            ctrl.stations = getFilteredStations();
        });
    },
    templateUrl: 'app/data/stations.component.html'
});

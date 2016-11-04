'use strict';

/*global angular*/

angular.module('app').component('stations', {
    controller: function(dataService, tableService) {
        var _this = this;
        var _allStations = [];

        function getFilteredStations() {
            return _this.showTraceOnly ? tableService.getElementsOnTrace(_allStations) : _allStations;
        }

        _this.stations = getFilteredStations();
        _this.order = "data.id";
        _this.showTraceOnly = dataService.getShowTraceOnly();

        _this.getClass = function(station) {
            return tableService.getClass(station);
        };

        _this.getStyle = function(station) {
            return tableService.getStyle(station);
        };

        _this.onChange = function(property, value) {
            switch (property) {
                case "showTraceOnly":
                    _this.showTraceOnly = value;
                    dataService.setShowTraceOnly(value);
                    _this.stations = getFilteredStations();
                    break;
            }
        };

        dataService.getData().then(function(data) {
            _allStations = data.stations;
            _this.stations = getFilteredStations();
        });
    },
    templateUrl: 'app/data/stations.component.html'
});

'use strict';

/*global angular*/

angular.module('app').component('deliveries', {
    controller: function(dataService, tableService) {
        var ctrl = this;
        var _allDeliveries = [];

        function getFilteredDeliveries() {
            return ctrl.showTraceOnly ? tableService.getElementsOnTrace(_allDeliveries) : _allDeliveries;
        }

        ctrl.deliveries = getFilteredDeliveries();
        ctrl.order = "data.id";
        ctrl.showTraceOnly = dataService.getShowTraceOnly();

        ctrl.getClass = function(delivery) {
            return tableService.getClass(delivery);
        };

        ctrl.onChange = function(property, value) {
            switch (property) {
                case "showTraceOnly":
                    ctrl.showTraceOnly = value;
                    dataService.setShowTraceOnly(value);
                    ctrl.deliveries = getFilteredDeliveries();
                    break;
            }
        };

        dataService.getData().then(function(data) {
            _allDeliveries = data.deliveries;
            ctrl.deliveries = getFilteredDeliveries();
        });
    },
    templateUrl: 'app/data/deliveries.component.html'
});

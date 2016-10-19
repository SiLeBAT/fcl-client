'use strict';

/*global angular*/

angular.module('app').component('deliveries', {
    controller: function(dataService) {
        var ctrl = this;
        var allDeliveries = [];
        var getFilteredDeliveries = function() {
            return ctrl.showTraceOnly ? allDeliveries.filter(ctrl.isOnTrace) : allDeliveries;
        };

        ctrl.deliveries = getFilteredDeliveries();
        ctrl.order = "data.id";
        ctrl.showTraceOnly = dataService.getShowTraceOnly();

        ctrl.isOnTrace = function(delivery) {
            return delivery.data.forward || delivery.data.backward;
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
            allDeliveries = data.deliveries;
            ctrl.deliveries = getFilteredDeliveries();
        });
    },
    templateUrl: 'app/data/deliveries.component.html'
});

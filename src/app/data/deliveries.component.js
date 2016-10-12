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
        ctrl.showTraceOnly = false;

        ctrl.isOnTrace = function(delivery) {
            return delivery.data.forward || delivery.data.backward;
        };

        ctrl.toggle = function(property) {
            switch (property) {
                case "showTraceOnly":
                    ctrl.showTraceOnly = !ctrl.showTraceOnly;
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

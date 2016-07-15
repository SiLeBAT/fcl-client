'use strict';

/*global angular*/

angular.module('app').component('deliveries', {
    bindings: {},
    controller: function(dataService) {
        var ctrl = this;

        ctrl.deliveries = [];
        ctrl.order = "data.id";

        dataService.getData().then(function(data) {
            ctrl.deliveries = data.deliveries;
        });
    },
    templateUrl: 'app/data/deliveries.component.html'
});

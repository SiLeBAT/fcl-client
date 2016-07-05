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
    template: '' +
        '<div class="container" layout="row" flex>' +
        '   <md-sidenav md-component-id="sidenav" class="md-whiteframe-4dp" md-is-locked-open="$mdMedia(\'gt-sm\')">' +
        '   </md-sidenav>' +
        '   <md-content layout-padding flex>' +
        '       <md-list>' +
        '           <md-list-item ng-repeat="station in $ctrl.stations" class="noright">' +
        '               <p>{{station.data.name}}</p>' +
        '           </md-list-item>' +
        '       </md-list>' +
        '   </md-content>' +
        '</div>'
});
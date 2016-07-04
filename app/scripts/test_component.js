'use strict';

/*global angular*/

angular.module('app').component('test', {
    bindings: {},
    controller: function($resource) {
        var ctrl = this;

        ctrl.stations = {};
        ctrl.deliveries = {};

        $resource('data/bbk.json').get(function(data) {
            ctrl.stations = data.stations;
            ctrl.deliveries = data.deliveries;
        });
    },
    template: '' +
        '<div class="container" layout="row" flex>' +
        '   <md-sidenav md-component-id="sidenav" class="md-whiteframe-4dp" md-is-locked-open="$mdMedia(\'gt-sm\')">' +
        '   </md-sidenav>' +
        '   <md-list>' +
        '       <md-list-item ng-repeat="station in $ctrl.stations" class="noright">' +
        '           <p>{{station}}</p>' +
        '       </md-list-item>' +
        '   </md-list>' +
        '</div>'
});
'use strict';

/*global angular, console*/

angular.module('app').component('main', {
    bindings: {},
    controller: function(dataProvider, graph) {
        var ctrl = this;
        
        ctrl.graphStyle = {
            height: '100%',
            width: '100%',
            position: 'absolute',
            left: 0,
            top: 0
        };

        ctrl.nodeSize = 50;
        ctrl.fontSize = 12;

        dataProvider.get(function(data) {
            graph.init(data.stations, data.deliveries);
        });

        ctrl.onNodeSizeChange = function(property, value) {
            switch (property) {
                case "nodeSize":
                    ctrl.nodeSize = value;
                    graph.setNodeSize(value);
                    break;
                case "fontSize":
                    ctrl.fontSize = value;
                    graph.setFontSize(value);
                    break;
            }
        };
    },
    template: '' +
        '<div class="container" layout="row" flex>' +
        '   <md-sidenav md-component-id="sidenav" class="md-whiteframe-4dp" md-is-locked-open="$mdMedia(\'gt-sm\')">' +
        '       <settings node-size="$ctrl.nodeSize" font-size="$ctrl.fontSize" on-change="$ctrl.onNodeSizeChange(property, value)"></settings>' +
        '   </md-sidenav>' +
        '   <div id="graph" ng-style="$ctrl.graphStyle" flex></div>' +
        '</div>'
});
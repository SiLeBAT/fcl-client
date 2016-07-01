'use strict';

/*global angular*/

angular.module('app').component('main', {
    bindings: {},
    controller: function(dataProvider, graph) {
        this.graphStyle = {
            height: '100%',
            width: '100%',
            position: 'absolute',
            left: 0,
            top: 0
        };

        this.nodeSize = 50;
        this.fontSize = 12;

        graph.init(dataProvider.getNodes(), dataProvider.getEdges());

        this.onNodeSizeChange = function(property, value) {
            switch (property) {
                case "nodeSize":
                    this.nodeSize = value;
                    graph.setNodeSize(value);
                    break;
                case "fontSize":
                    this.fontSize = value;
                    graph.setFontSize(value);
                    break;
            }
        };
    },
    template: '' +
        '<div class="container" layout="row" flex>' +
        '   <md-sidenav md-component-id="sidenav" class="md-whiteframe-4dp" md-is-locked-open="$mdMedia(\'gt-sm\')" flex>' +
        '       <settings node-size="$ctrl.nodeSize" font-size="$ctrl.fontSize" on-change="$ctrl.onNodeSizeChange(property, value)"></settings>' +
        '   </md-sidenav>' +
        '   <div id="graph" ng-style="$ctrl.graphStyle" flex></div>' +
        '</div>'
});
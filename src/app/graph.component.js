'use strict';

/*global angular*/

angular.module('app').component('graph', {
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
            graph.init(data);
        }, function(error) {
            console.log(error);
        });

        ctrl.onChange = function(property, value) {
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
    templateUrl: 'app/graph.component.html'
});

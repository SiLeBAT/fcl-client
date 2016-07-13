'use strict';

/*global angular*/

angular.module('app').component('settings', {
    controller: function(graph, dataProvider) {
        dataProvider.get(function(data) {
            graph.init(data);
        });
        
        var ctrl = this;

        ctrl.nodeSizes = {
            Small: 50,
            Large: 100
        };

        ctrl.fontSizes = {
            Small: 12,
            Large: 18
        };

        ctrl.nodeSize = ctrl.nodeSizes.Small;
        ctrl.fontSize = ctrl.fontSizes.Small;

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
    templateUrl: 'app/graph/settings.component.html'
});

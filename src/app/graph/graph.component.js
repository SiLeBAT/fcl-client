'use strict';

/*global angular*/

angular.module('app').component('graph', {
    controller: function(graph, dataService) {
        var ctrl = this;

        ctrl.nodeSizes = dataService.nodeSizes;
        ctrl.fontSizes = dataService.fontSizes;
        ctrl.nodeSize = dataService.getNodeSize();
        ctrl.fontSize = dataService.getFontSize();

        ctrl.onChange = function(property, value) {
            switch (property) {
                case "nodeSize":
                    ctrl.nodeSize = value;
                    graph.setNodeSize(value);
                    dataService.setNodeSize(value);
                    break;
                case "fontSize":
                    ctrl.fontSize = value;
                    graph.setFontSize(value);
                    dataService.setFontSize(value);
                    break;
            }
        };

        dataService.getData().then(function(data) {
            var json = graph.getJson();
            
            if (json !== undefined) {
                graph.initFromJson(graph.getJson(), data);
            }
            else {
                graph.initFromData(data);
            }

            graph.setNodeSize(ctrl.nodeSize);
            graph.setFontSize(ctrl.fontSize);
        });
    },
    templateUrl: 'app/graph/graph.component.html'
});

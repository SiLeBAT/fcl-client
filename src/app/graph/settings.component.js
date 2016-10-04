'use strict';

/*global angular*/

angular.module('app').component('settings', {
    controller: function(graph, dataService) {
        var ctrl = this;

        ctrl.nodeSizes = dataService.nodeSizes;
        ctrl.fontSizes = dataService.fontSizes;
        ctrl.nodeSize = dataService.getNodeSize();
        ctrl.fontSize = dataService.getFontSize();

        dataService.getData().then(function(data) {
            if (graph.getJson() !== undefined) {
                graph.initFromJson(graph.getJson());
            }
            else {
                graph.init(data);
            }

            graph.setNodeSize(ctrl.nodeSize);
            graph.setFontSize(ctrl.fontSize);
        });

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
    },
    templateUrl: 'app/graph/settings.component.html'
});

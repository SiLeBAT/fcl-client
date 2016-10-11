'use strict';

/*global angular*/

angular.module('app').component('graph', {
    controller: function(graphService, dataService) {
        var ctrl = this;

        ctrl.nodeSizes = dataService.nodeSizes;
        ctrl.fontSizes = dataService.fontSizes;
        ctrl.nodeSize = dataService.getNodeSize();
        ctrl.fontSize = dataService.getFontSize();

        ctrl.onChange = function(property, value) {
            switch (property) {
                case "nodeSize":
                    ctrl.nodeSize = value;
                    graphService.setNodeSize(value);
                    dataService.setNodeSize(value);
                    break;
                case "fontSize":
                    ctrl.fontSize = value;
                    graphService.setFontSize(value);
                    dataService.setFontSize(value);
                    break;
            }
        };

        dataService.getData().then(function(data) {
            graphService.init(data);
            graphService.setNodeSize(ctrl.nodeSize);
            graphService.setFontSize(ctrl.fontSize);
        });
    },
    templateUrl: 'app/graph/graph.component.html'
});

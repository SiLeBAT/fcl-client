'use strict';

/*global angular*/

angular.module('app').component('graph', {
    controller: function(graphService, dataService) {
        var ctrl = this;

        ctrl.nodeSizes = dataService.NODE_SIZES;
        ctrl.fontSizes = dataService.FONT_SIZES;
        ctrl.nodeSize = dataService.getNodeSize();
        ctrl.fontSize = dataService.getFontSize();
        ctrl.mergeDeliveries = dataService.getMergeDeliveries();

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
                case "mergeDeliveries":
                    ctrl.mergeDeliveries = value;
                    graphService.setMergeDeliveries(value);
                    dataService.setMergeDeliveries(value);
                    break;
            }
        };

        dataService.getData().then(function(data) {
            graphService.init(data);
            graphService.setNodeSize(ctrl.nodeSize);
            graphService.setFontSize(ctrl.fontSize);
            graphService.setMergeDeliveries(ctrl.mergeDeliveries);
        });
    },
    templateUrl: 'app/graph/graph.component.html'
});

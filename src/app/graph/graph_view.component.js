'use strict';

/*global angular,$*/

angular.module('app').component('graphView', {
    controller: function(graphService, dataService) {
        var _this = this;

        _this.nodeSizes = dataService.NODE_SIZES;
        _this.fontSizes = dataService.FONT_SIZES;
        _this.settings = dataService.getGraphSettings();

        _this.onChange = function(property, value) {
            switch (property) {
                case "nodeSize":
                    _this.settings.nodeSize = value;
                    graphService.setNodeSize(value);
                    break;
                case "fontSize":
                    _this.settings.fontSize = value;
                    graphService.setFontSize(value);
                    break;
                case "mergeDeliveries":
                    _this.settings.mergeDeliveries = value;
                    graphService.setMergeDeliveries(value);
                    break;
            }
        };

        dataService.getData().then(function(data) {
            graphService.init($('#graph')[0], data);
            graphService.setNodeSize(_this.settings.nodeSize);
            graphService.setFontSize(_this.settings.fontSize);
            graphService.setMergeDeliveries(_this.settings.mergeDeliveries);
        });
    },
    templateUrl: 'app/graph/graph_view.component.html'
});

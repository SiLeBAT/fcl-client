'use strict';

/*global angular,$*/

angular.module('app').component('graph', {
    controller: function(graphService, dataService) {
        var _this = this;

        _this.nodeSizes = dataService.NODE_SIZES;
        _this.fontSizes = dataService.FONT_SIZES;
        _this.nodeSize = dataService.getNodeSize();
        _this.fontSize = dataService.getFontSize();
        _this.mergeDeliveries = dataService.getMergeDeliveries();

        _this.onChange = function(property, value) {
            switch (property) {
                case "nodeSize":
                    _this.nodeSize = value;
                    graphService.setNodeSize(value);
                    dataService.setNodeSize(value);
                    break;
                case "fontSize":
                    _this.fontSize = value;
                    graphService.setFontSize(value);
                    dataService.setFontSize(value);
                    break;
                case "mergeDeliveries":
                    _this.mergeDeliveries = value;
                    graphService.setMergeDeliveries(value);
                    dataService.setMergeDeliveries(value);
                    break;
            }
        };

        _this.style = {
            height: '100%',
            width: '100%',
            position: 'absolute',
            left: 0,
            top: 0
        };

        dataService.getData().then(function(data) {
            graphService.init($('#graph')[0], data);
            graphService.setNodeSize(_this.nodeSize);
            graphService.setFontSize(_this.fontSize);
            graphService.setMergeDeliveries(_this.mergeDeliveries);
        });
    },
    templateUrl: 'app/graph/graph.component.html'
});

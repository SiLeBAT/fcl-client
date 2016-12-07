'use strict';

/*global angular,$*/

angular.module('app').component('splitView', {
    controller: function($scope, graphService, dataService, tableService) {
        var _this = this;
        var _stations = [];
        var _deliveries = [];

        _this.nodeSizes = dataService.NODE_SIZES;
        _this.fontSizes = dataService.FONT_SIZES;
        _this.nodeSize = dataService.getGraphSettings().nodeSize;
        _this.fontSize = dataService.getGraphSettings().fontSize;
        _this.mergeDeliveries = dataService.getGraphSettings().mergeDeliveries;

        _this.onChange = function(property, value) {
            switch (property) {
                case "nodeSize":
                    _this.nodeSize = value;
                    graphService.setNodeSize(value);
                    break;
                case "fontSize":
                    _this.fontSize = value;
                    graphService.setFontSize(value);
                    break;
                case "mergeDeliveries":
                    _this.mergeDeliveries = value;
                    graphService.setMergeDeliveries(value);
                    break;
                case "showTraceOnly":
                    _this.showTraceOnly = value;
                    _this.elements = tableService.getElements(_stations, _deliveries, _this.mode, _this.showTraceOnly);
                    break;
            }

            if (dataService.getGraphSettings().hasOwnProperty(property)) {
                dataService.getGraphSettings()[property] = value;
            }

            if (dataService.getTableSettings().hasOwnProperty(property)) {
                dataService.getTableSettings()[property] = value;
            }
        };

        _this.modes = dataService.TABLE_MODES;

        _this.mode = dataService.getTableSettings().mode;
        _this.order = dataService.getTableSettings().order;
        _this.showTraceOnly = dataService.getTableSettings().showTraceOnly;

        _this.columns = dataService.TABLE_COLUMNS[_this.mode];
        _this.elements = tableService.getElements(_stations, _deliveries, _this.mode, _this.showTraceOnly);

        _this.getCellStyle = function(station, column) {
            return tableService.getCellStyle(station, column, _this.columns);
        };

        _this.getRowStyle = function(station) {
            return tableService.getRowStyle(station);
        };

        _this.switchModeTo = function(mode) {
            _this.mode = mode;
            _this.columns = dataService.TABLE_COLUMNS[_this.mode];
            _this.elements = tableService.getElements(_stations, _deliveries, _this.mode, _this.showTraceOnly);
            dataService.getTableSettings().mode = mode;
        };

        dataService.getData().then(function(data) {
            graphService.init($('#graph')[0], data);
            graphService.setNodeSize(_this.nodeSize);
            graphService.setFontSize(_this.fontSize);
            graphService.setMergeDeliveries(_this.mergeDeliveries);
            graphService.onSelectionChange(function() {
                $scope.$apply();
            });
            _stations = data.stations;
            _deliveries = data.deliveries;
            _this.elements = tableService.getElements(_stations, _deliveries, _this.mode, _this.showTraceOnly);
        });
    },
    templateUrl: 'app/split/split_view.component.html'
});

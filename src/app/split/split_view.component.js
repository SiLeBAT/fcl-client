'use strict';

/*global angular,$*/

angular.module('app').component('splitView', {
    controller: function($scope, graphService, dataService, tableService) {
        var _this = this;
        var _stations = [];
        var _deliveries = [];

        _this.nodeSizes = dataService.NODE_SIZES;
        _this.fontSizes = dataService.FONT_SIZES;
        _this.graphSettings = dataService.getGraphSettings();

        _this.modes = dataService.TABLE_MODES;
        _this.tableSettings = dataService.getTableSettings();
        _this.columns = dataService.TABLE_COLUMNS[_this.tableSettings.mode];
        _this.elements = tableService.getElements(_stations, _deliveries, _this.tableSettings);

        _this.onChange = function(property, value) {
            switch (property) {
                case "nodeSize":
                    _this.graphSettings.nodeSize = value;
                    graphService.setNodeSize(value);
                    break;
                case "fontSize":
                    _this.graphSettings.fontSize = value;
                    graphService.setFontSize(value);
                    break;
                case "mergeDeliveries":
                    _this.graphSettings.mergeDeliveries = value;
                    graphService.setMergeDeliveries(value);
                    break;
                case "showTraceOnly":
                    _this.tableSettings.showTraceOnly = value;
                    _this.elements = tableService.getElements(_stations, _deliveries, _this.tableSettings);
                    break;
            }
        };

        _this.getCellStyle = function(station, column) {
            return tableService.getCellStyle(station, column, _this.columns);
        };

        _this.getRowStyle = function(station) {
            return tableService.getRowStyle(station);
        };

        _this.switchModeTo = function(mode) {
            _this.tableSettings.mode = mode;
            _this.columns = dataService.TABLE_COLUMNS[mode];
            _this.elements = tableService.getElements(_stations, _deliveries, _this.tableSettings);
        };

        dataService.getData().then(function(data) {
            graphService.init($('#graph')[0], data);
            graphService.setNodeSize(_this.graphSettings.nodeSize);
            graphService.setFontSize(_this.graphSettings.fontSize);
            graphService.setMergeDeliveries(_this.graphSettings.mergeDeliveries);
            graphService.onSelectionChange(function() {
                $scope.$apply();
            });
            _stations = data.stations;
            _deliveries = data.deliveries;
            _this.elements = tableService.getElements(_stations, _deliveries, _this.tableSettings);
        });
    },
    templateUrl: 'app/split/split_view.component.html'
});

'use strict';

/*global angular,$*/

angular.module('app').component('mainView', {
    controller: function($scope, graphService, dataService, tableService) {
        var _this = this;
        var _stations = [];
        var _deliveries = [];

        _this.settings = dataService.getSettings();

        _this.nodeSizes = dataService.NODE_SIZES;
        _this.fontSizes = dataService.FONT_SIZES;
        _this.graphSettings = dataService.getGraphSettings();

        _this.modes = dataService.TABLE_MODES;
        _this.tableSettings = dataService.getTableSettings();
        _this.columns = dataService.TABLE_COLUMNS[_this.tableSettings.mode];
        _this.elements = tableService.getElements(_stations, _deliveries, _this.tableSettings);

        _this.onChange = function(property, value) {
            switch (property) {
                case 'nodeSize':
                    _this.graphSettings.nodeSize = value;
                    graphService.setNodeSize(value);
                    break;
                case 'fontSize':
                    _this.graphSettings.fontSize = value;
                    graphService.setFontSize(value);
                    break;
                case 'mergeDeliveries':
                    _this.graphSettings.mergeDeliveries = value;
                    graphService.setMergeDeliveries(value);
                    break;
                case 'mode':
                    _this.tableSettings.mode = value;
                    _this.columns = dataService.TABLE_COLUMNS[value];
                    _this.elements = tableService.getElements(_stations, _deliveries, _this.tableSettings);
                    break;
                case 'showAll':
                    _this.tableSettings.showAll = value;
                    _this.elements = tableService.getElements(_stations, _deliveries, _this.tableSettings);
                    break;
                case 'showSelected':
                    _this.tableSettings.showSelected = value;
                    _this.elements = tableService.getElements(_stations, _deliveries, _this.tableSettings);
                    break;
                case 'showObserved':
                    _this.tableSettings.showObserved = value;
                    _this.elements = tableService.getElements(_stations, _deliveries, _this.tableSettings);
                    break;
                case 'showTrace':
                    _this.tableSettings.showTrace = value;
                    _this.elements = tableService.getElements(_stations, _deliveries, _this.tableSettings);
                    break;
                case 'showOutbreak':
                    _this.tableSettings.showOutbreak = value;
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

        dataService.getData().then(function(data) {
            graphService.init('#graph', data);
            graphService.setNodeSize(_this.graphSettings.nodeSize);
            graphService.setFontSize(_this.graphSettings.fontSize);
            graphService.setMergeDeliveries(_this.graphSettings.mergeDeliveries);
            graphService.onSelectionChange(function() {
                $scope.$apply();
                _this.elements = tableService.getElements(_stations, _deliveries, _this.tableSettings);
            });
            graphService.onUpdate(function() {
                _this.elements = tableService.getElements(_stations, _deliveries, _this.tableSettings);
            });
            _stations = data.stations;
            _deliveries = data.deliveries;
            _this.elements = tableService.getElements(_stations, _deliveries, _this.tableSettings);
        });
    },
    templateUrl: 'app/main_view.component.html'
});

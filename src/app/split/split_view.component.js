'use strict';

/*global angular,$*/

angular.module('app').component('splitView', {
    controller: function(graphService, dataService, tableService) {
        var _this = this;
        var _stations = [];
        var _deliveries = [];

        function updateElements() {
            _this.columns = dataService.TABLE_COLUMNS[_this.mode];

            switch (_this.mode) {
                case "stations":
                    _this.elements = _this.showTraceOnly ? tableService.getElementsOnTrace(_stations) : _stations;
                    break;
                case "deliveries":
                    _this.elements = _this.showTraceOnly ? tableService.getElementsOnTrace(_deliveries) : _deliveries;
                    break;
                default:
                    _this.elements = undefined;
                    break;
            }
        }

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
                    updateElements();
                    break;
            }

            if (dataService.getGraphSettings().hasOwnProperty(property)) {
                dataService.getGraphSettings()[property] = value;
            }

            if (dataService.getTableSettings().hasOwnProperty(property)) {
                dataService.getTableSettings()[property] = value;
            }
        };

        _this.style = {
            height: '100%',
            width: '100%',
            position: 'absolute',
            left: 0,
            top: 0
        };

        _this.modes = dataService.TABLE_MODES;

        _this.mode = dataService.getTableSettings().mode;
        _this.order = dataService.getTableSettings().order;
        _this.showTraceOnly = dataService.getTableSettings().showTraceOnly;

        updateElements();

        _this.getCellStyle = function(station, column) {
            var index = _this.columns.indexOf(column);
            var position;

            if (index === 0) {
                position = 'first';
            }
            else if (index === _this.columns.length - 1) {
                position = 'last';
            }

            return tableService.getCellStyle(station, position);
        };

        _this.getRowStyle = function(station) {
            return tableService.getRowStyle(station);
        };

        _this.switchModeTo = function(mode) {
            _this.mode = mode;
            dataService.getTableSettings().mode = mode;
            updateElements();
        };

        dataService.getData().then(function(data) {
            graphService.init($('#graph')[0], data);
            graphService.setNodeSize(_this.nodeSize);
            graphService.setFontSize(_this.fontSize);
            graphService.setMergeDeliveries(_this.mergeDeliveries);
            _stations = data.stations;
            _deliveries = data.deliveries;
            updateElements();
        });
    },
    templateUrl: 'app/split/split_view.component.html'
});

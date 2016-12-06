'use strict';

/*global angular*/

angular.module('app').component('tableView', {
    controller: function(dataService, tableService) {
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

        _this.onChange = function(property, value) {
            switch (property) {
                case "showTraceOnly":
                    _this.showTraceOnly = value;
                    updateElements();
                    break;
            }

            dataService.getTableSettings()[property] = value;
        };

        dataService.getData().then(function(data) {
            _stations = data.stations;
            _deliveries = data.deliveries;
            updateElements();
        });
    },
    templateUrl: 'app/tables/table_view.component.html'
});

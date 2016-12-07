'use strict';

/*global angular*/

angular.module('app').component('tableView', {
    controller: function(dataService, tableService) {
        var _this = this;
        var _stations = [];
        var _deliveries = [];


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

        _this.onChange = function(property, value) {
            switch (property) {
                case "showTraceOnly":
                    _this.showTraceOnly = value;
                    _this.elements = tableService.getElements(_stations, _deliveries, _this.mode, _this.showTraceOnly);
                    break;
            }

            dataService.getTableSettings()[property] = value;
        };

        dataService.getData().then(function(data) {
            _stations = data.stations;
            _deliveries = data.deliveries;
            _this.elements = tableService.getElements(_stations, _deliveries, _this.mode, _this.showTraceOnly);
        });
    },
    templateUrl: 'app/table/table_view.component.html'
});

'use strict';

/*global angular*/

angular.module('app').component('tableView', {
    controller: function(dataService, tableService) {
        var _this = this;
        var _stations = [];
        var _deliveries = [];

        _this.modes = dataService.TABLE_MODES;
        _this.settings = dataService.getTableSettings();
        _this.columns = dataService.TABLE_COLUMNS[_this.settings.mode];
        _this.elements = tableService.getElements(_stations, _deliveries, _this.settings);

        _this.getCellStyle = function(station, column) {
            return tableService.getCellStyle(station, column, _this.columns);
        };

        _this.getRowStyle = function(station) {
            return tableService.getRowStyle(station);
        };

        _this.onChange = function(property, value) {
            switch (property) {
                case 'mode':
                    _this.settings.mode = value;
                    _this.columns = dataService.TABLE_COLUMNS[value];
                    _this.elements = tableService.getElements(_stations, _deliveries, _this.settings);
                    break;
                case 'showTraceOnly':
                    _this.settings.showTraceOnly = value;
                    _this.elements = tableService.getElements(_stations, _deliveries, _this.settings);
                    break;
            }
        };

        dataService.getData().then(function(data) {
            _stations = data.stations;
            _deliveries = data.deliveries;
            _this.elements = tableService.getElements(_stations, _deliveries, _this.settings);
        });
    },
    templateUrl: 'app/table/table_view.component.html'
});

'use strict';

/*global angular*/

angular.module('app').component('deliveries', {
    controller: function(dataService, tableService) {
        var _this = this;
        var _allDeliveries = [];

        function getFilteredDeliveries() {
            return _this.showTraceOnly ? tableService.getElementsOnTrace(_allDeliveries) : _allDeliveries;
        }

        _this.deliveries = getFilteredDeliveries();
        _this.order = "data.id";
        _this.showTraceOnly = dataService.getShowTraceOnly();

        _this.getCellStyle = function(delivery, position) {
            return tableService.getCellStyle(delivery, position);
        };

        _this.getRowStyle = function(delivery) {
            return tableService.getRowStyle(delivery);
        };

        _this.onChange = function(property, value) {
            switch (property) {
                case "showTraceOnly":
                    _this.showTraceOnly = value;
                    dataService.setShowTraceOnly(value);
                    _this.deliveries = getFilteredDeliveries();
                    break;
            }
        };

        dataService.getData().then(function(data) {
            _allDeliveries = data.deliveries;
            _this.deliveries = getFilteredDeliveries();
        });
    },
    templateUrl: 'app/data/deliveries.component.html'
});

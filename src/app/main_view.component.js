'use strict';

/*global angular,$*/

angular.module('app').component('mainView', {
    controller: function($scope, graphService, dataService) {
        var _this = this;

        function updateTable() {
            _this.updateTable++;
        }

        _this.stations = [];
        _this.deliveries = [];
        _this.settings = dataService.getSettings();

        _this.nodeSizes = dataService.NODE_SIZES;
        _this.fontSizes = dataService.FONT_SIZES;
        _this.graphSettings = dataService.getGraphSettings();

        _this.modes = dataService.TABLE_MODES;
        _this.tableSettings = dataService.getTableSettings();
        _this.updateTable = 0;

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
                    updateTable();
                    break;
                case 'showAll':
                    _this.tableSettings.showAll = value;
                    updateTable();
                    break;
                case 'showSelected':
                    _this.tableSettings.showSelected = value;
                    updateTable();
                    break;
                case 'showObserved':
                    _this.tableSettings.showObserved = value;
                    updateTable();
                    break;
                case 'showTrace':
                    _this.tableSettings.showTrace = value;
                    updateTable();
                    break;
                case 'showOutbreak':
                    _this.tableSettings.showOutbreak = value;
                    updateTable();
                    break;
            }
        };

        dataService.getData().then(function(data) {
            graphService.init('#graph', data);
            graphService.setNodeSize(_this.graphSettings.nodeSize);
            graphService.setFontSize(_this.graphSettings.fontSize);
            graphService.setMergeDeliveries(_this.graphSettings.mergeDeliveries);
            graphService.onSelectionChange(function() {
                updateTable();
            });
            graphService.onUpdate(function() {
                updateTable();
            });
            _this.stations = data.stations;
            _this.deliveries = data.deliveries;
            updateTable();
        });
    },
    templateUrl: 'app/main_view.component.html'
});

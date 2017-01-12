'use strict';

/*global angular*/

angular.module('app').component('elementsTable', {
    bindings: {
        stations: '<',
        deliveries: '<',
        settings: '<',
        update: '<'
    },
    controller: function($scope, dataService, utilService) {
        var _this = this;

        _this.columns = [];
        _this.elements = [];

        $scope.$watch('$ctrl.update', function() {
            var elements;

            switch (_this.settings.mode) {
                case "Stations":
                    elements = _this.stations;
                    break;
                case "Deliveries":
                    elements = _this.deliveries;
                    break;
                default:
                    elements = [];
                    break;
            }

            _this.columns = dataService.TABLE_COLUMNS[_this.settings.mode];
            _this.elements = elements.filter(function(e) {
                if (e.data.contained) {
                    return false;
                }

                return _this.settings.showAll ||
                    (_this.settings.showSelected && e.data.selected) ||
                    (_this.settings.showObserved && e.data.observed) ||
                    (_this.settings.showTrace && (e.data.forward || e.data.backward)) ||
                    (_this.settings.showOutbreak && e.data.outbreak);
            });
        });

        _this.getCellStyle = function(element, column) {
            if (typeof element !== 'undefined' && element.data.selected) {
                var css = {
                    'border-top': '2px #00f solid',
                    'border-bottom': '2px #00f solid'
                };

                var index = _this.columns.indexOf(column);

                if (index === 0) {
                    css['border-left'] = '2px #00f solid';
                }
                else if (index === _this.columns.length - 1) {
                    css['border-right'] = '2px #00f solid';
                }

                return css;
            }
            else {
                return {
                    'border-top': '1px #eee solid',
                    'border-bottom': '1px #eee solid'
                };
            }
        };

        _this.getRowStyle = function(element) {
            var colors = [];

            if (element.data.forward) {
                colors.push(dataService.COLORS.forward);
            }
            if (element.data.backward) {
                colors.push(dataService.COLORS.backward);
            }
            if (element.data.observed) {
                colors.push(dataService.COLORS.observed);
            }
            if (element.data.outbreak) {
                colors.push(dataService.COLORS.outbreak);
            }

            if (colors.length === 0) {
                colors.push([255, 255, 255]);
            }

            if (element.data.selected) {
                for (let i = 0; i < colors.length; i++) {
                    colors[i] = utilService.mixColors(colors[i], [0, 0, 255]);
                }
            }

            if (colors.length === 1) {
                return {
                    'background-color': utilService.colorToCss(colors[0])
                };
            }
            else {
                var css = [];

                for (let c of colors) {
                    css.push(utilService.colorToCss(c));
                }

                return {
                    'background-repeat': 'no-repeat',
                    'background-image': 'linear-gradient(' + css.join(',') + ')'
                };
            }
        };
    },
    templateUrl: 'app/table/elements_table.component.html'
});

'use strict';

/*global angular*/

angular.module('app').service('tableService', function(dataService, utilService) {

    var _this = this;

    _this.getElements = function(stations, deliveries, settings) {
        var elements;

        switch (settings.mode) {
            case "Stations":
                elements = stations;
                break;
            case "Deliveries":
                elements = deliveries;
                break;
            default:
                elements = [];
                break;
        }

        return elements.filter(function(e) {
            if (e.data.contains) {
                return false;
            }

            return settings.showAll ||
                (settings.showSelected && e.data.selected) ||
                (settings.showObserved && e.data.observed) ||
                (settings.showTrace && (e.data.forward || e.data.backward)) ||
                (settings.showOutbreak && e.data.outbreak);
        });
    };

    _this.getCellStyle = function(element, column, allColumns) {
        if (typeof element !== 'undefined' && element.data.selected) {
            var css = {
                'border-top': '2px #00f solid',
                'border-bottom': '2px #00f solid'
            };
            var index = allColumns.indexOf(column);

            if (index === 0) {
                css['border-left'] = '2px #00f solid';
            }
            else if (index === allColumns.length - 1) {
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
});

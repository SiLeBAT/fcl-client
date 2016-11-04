'use strict';

/*global angular*/

angular.module('app').service('tableService', function(dataService) {

    var _this = this;

    _this.getElementsOnTrace = function(elements) {
        return elements.filter(function(elements) {
            return elements.data.forward || elements.data.backward;
        });
    };

    _this.getClass = function(element) {
        return element.data.selected ? 'selected' : '';
    };

    _this.getStyle = function(element) {
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
                colors[i] = dataService.mixColors(colors[i], [0, 0, 255]);
            }
        }

        if (colors.length === 1) {
            return {
                'background-color': dataService.colorToCss(colors[0])
            };
        }
        else {
            var css = [];

            for (let c of colors) {
                css.push(dataService.colorToCss(c));
            }

            return {
                'background-repeat': 'no-repeat',
                'background-image': 'linear-gradient(' + css.join(',') + ')'
            };
        }
    };
});

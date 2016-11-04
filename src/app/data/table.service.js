'use strict';

/*global angular*/

angular.module('app').service('tableService', function(dataService) {

    var _this = this;

    _this.getElementsOnTrace = function(elements) {
        return elements.filter(function(elements) {
            return elements.data.forward || elements.data.backward;
        });
    };

    _this.getStyle = function(element) {
        var colors = [];

        if (element.data.forward) {
            colors.push(dataService.colorToCss(dataService.COLORS.forward));
        }
        if (element.data.backward) {
            colors.push(dataService.colorToCss(dataService.COLORS.backward));
        }
        if (element.data.observed) {
            colors.push(dataService.colorToCss(dataService.COLORS.observed));
        }
        if (element.data.outbreak) {
            colors.push(dataService.colorToCss(dataService.COLORS.outbreak));
        }

        if (colors.length === 0) {
            return {};
        }
        else if (colors.length === 1) {
            return {
                'background-color': colors[0]
            };
        }
        else {
            return {
                'background-color': 'rgb(128, 128, 128)',
                'background-repeat': 'no-repeat',
                'background-image': 'linear-gradient(' + colors.join(',') + ')'
            };
        }
    };
});

'use strict';

/*global angular*/

angular.module('app').service('utilService', function($q, $resource) {

    var _this = this;

    _this.colorToCss = function(color) {
        return 'rgb(' + color[0] + ', ' + color[1] + ', ' + color[2] + ')';
    };

    _this.mixColors = function(color1, color2) {
        var r = Math.round((color1[0] + color2[0]) / 2);
        var g = Math.round((color1[1] + color2[1]) / 2);
        var b = Math.round((color1[2] + color2[2]) / 2);

        return [r, g, b];
    };

    _this.getAllCombinations = function(values) {
        var n = Math.pow(2, values.length);
        var combinations = [];

        for (let i = 1; i < n; i++) {
            var bits = i.toString(2).split('').reverse().join('');
            var combination = [];

            for (let j = 0; j < values.length; j++) {
                if (bits[j] === '1') {
                    combination.push(values[j]);
                }
            }

            combinations.push(combination);
        }

        combinations.sort(function(c1, c2) {
            return c1.length - c2.length;
        });

        return combinations;
    };

    _this.getCenter = function(positions) {
        var xSum = 0;
        var ySum = 0;

        for (let pos of positions) {
            xSum += pos.x;
            ySum += pos.y;
        }

        return {
            x: xSum / positions.length,
            y: ySum / positions.length
        };
    };

    _this.sum = function(position1, position2) {
        return {
            x: position1.x + position2.x,
            y: position1.y + position2.y
        };
    };

    _this.difference = function(position1, position2) {
        return {
            x: position1.x - position2.x,
            y: position1.y - position2.y
        };
    };

});

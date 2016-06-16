'use strict';

/*global angular */

angular.module('app').service('dataProvider', function() {

    var nodes = [{
        id: 'n1',
        name: 'Laurel',
        weight: 65
    }, {
        id: 'n2',
        name: 'Hardy',
        weight: 110
    }];

    var edges = [{
        id: 'e1',
        source: 'n1',
        target: 'n2'
    }, {
        id: 'e2',
        source: 'n2',
        target: 'n1'
    }];

    this.getNodes = function() {
        return nodes;
    };

    this.getEdges = function() {
        return edges;
    };

});
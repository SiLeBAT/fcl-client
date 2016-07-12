'use strict';

/*global angular*/

angular.module('app').component('graph', {
    bindings: {},
    controller: function(dataProvider, graph) {
        var ctrl = this;

        ctrl.graphStyle = {
            height: '100%',
            width: '100%',
            position: 'absolute',
            left: 0,
            top: 0
        };

        dataProvider.get(function(data) {
            graph.init(data);
        });
    },
    templateUrl: 'app/graph.component.html'
});

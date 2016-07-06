'use strict';

/*global angular*/

angular.module('app').component('main', {
    $routeConfig: [{
        path: '/',
        component: 'graph',
        name: 'Graph'
    }, {
        path: '/test',
        component: 'test',
        name: 'Test'
    }],
    controller: function($mdSidenav) {
        var ctrl = this;

        ctrl.toogleList = function() {
            $mdSidenav('sidenav').toggle();
        };
    },
    templateUrl: 'scripts/main.component.html'
});
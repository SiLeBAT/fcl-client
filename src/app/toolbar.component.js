'use strict';

/*global angular*/

angular.module('app').component('toolbar', {
    controller: function($mdSidenav) {
        var ctrl = this;

        ctrl.toogleList = function() {
            $mdSidenav('sidenav').toggle();
        };
    },
    templateUrl: 'app/toolbar.component.html'
});

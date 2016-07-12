'use strict';

/*global angular*/

angular.module('app').component('toolbar', {
    controller: function($state) {
        var ctrl = this;

        ctrl.currentNavItem = $state.current.name;
    },
    templateUrl: 'app/toolbar.component.html'
});

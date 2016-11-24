'use strict';

/*global angular*/

angular.module('app').component('toolbar', {
    controller: function($state, $transitions) {
        var _this = this;

        _this.currentNavItem = $state.current.name;

        $transitions.onEnter({}, function(transition, state) {
            _this.currentNavItem = state.name;
        });
    },
    templateUrl: 'app/toolbar.component.html'
});

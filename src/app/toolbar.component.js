'use strict';

/*global angular*/

angular.module('app').component('toolbar', {
    controller: function($state, $rootScope) {
        var _this = this;

        _this.currentNavItem = $state.current.name;

        $rootScope.$on('$stateChangeStart',
            function(event, toState, toParams, fromState, fromParams, options) {
                _this.currentNavItem = toState.name;
            });
    },
    templateUrl: 'app/toolbar.component.html'
});

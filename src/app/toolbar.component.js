'use strict';

/*global angular*/

angular.module('app').component('toolbar', {
    controller: function($state) {
        var _this = this;

        _this.currentNavItem = $state.current.name;
    },
    templateUrl: 'app/toolbar.component.html'
});

'use strict';

/*global angular*/

angular.module('app').component('toolbar', {
    controller: function($mdSidenav) {
        var _this = this;
        
        _this.toggle = function(id) {
            $mdSidenav(id).toggle();
        };
    },
    templateUrl: 'app/toolbar.component.html'
});

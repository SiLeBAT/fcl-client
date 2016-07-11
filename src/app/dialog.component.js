'use strict';

/*global angular*/

angular.module('app').component('testtest', {
    bindings: {
        stations: '<'
    },
    controller: function($mdDialog) {
        var ctrl = this;

        ctrl.closeDialog = function() {
            $mdDialog.hide();
        };
    },
    templateUrl: 'app/dialog.component.html'
});

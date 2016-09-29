'use strict';

/*global angular*/

angular.module('app').component('dialogToolbar', {
    bindings: {
        title: '@'
    },
    controller: function($mdDialog) {
        var ctrl = this;

        ctrl.closeDialog = function() {
            $mdDialog.cancel();
        };
    },
    templateUrl: 'app/dialogs/toolbar.component.html'
});

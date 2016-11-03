'use strict';

/*global angular*/

angular.module('app').component('dialogToolbar', {
    bindings: {
        title: '@'
    },
    controller: function($mdDialog) {
        var _this = this;

        _this.closeDialog = function() {
            $mdDialog.cancel();
        };
    },
    templateUrl: 'app/dialogs/toolbar.component.html'
});

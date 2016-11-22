'use strict';

/*global angular*/

angular.module('app').component('dialogMenu', {
    bindings: {
        options: '<',
        onSelect: '&'
    },
    templateUrl: 'app/dialogs/menu.component.html'
});

'use strict';

/*global angular*/

angular.module('app').component('contextMenu', {
    bindings: {
        options: '<',
        onSelect: '&'
    },
    templateUrl: 'app/dialogs/context_menu.component.html'
});

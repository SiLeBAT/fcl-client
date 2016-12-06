'use strict';

/*global angular*/

angular.module('app').component('dialogMenu', {
    bindings: {
        options: '<',
        onSelect: '&'
    },
    templateUrl: 'app/dialog/menu.component.html'
});

'use strict';

/*global angular*/

angular.module('app').component('dialogContent', {
    bindings: {
        elements: '<'
    },
    templateUrl: 'app/dialogs/content.component.html'
});

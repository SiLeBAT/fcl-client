'use strict';

/*global angular*/

angular.module('app').component('layoutSelect', {
    bindings: {
        onSelect: '&'
    },
    templateUrl: 'app/dialogs/layout_select.component.html'
});

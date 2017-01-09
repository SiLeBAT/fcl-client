'use strict';

/*global angular*/

angular.module('app').component('mainToolbar', {
    bindings: {
        settings: '<',
        onChange: '&'
    },
    templateUrl: 'app/main_toolbar.component.html'
});

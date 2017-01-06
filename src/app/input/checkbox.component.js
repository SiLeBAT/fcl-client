'use strict';

/*global angular*/

angular.module('app').component('checkbox', {
    bindings: {
        label: '@',
        selected: '<',
        disabled: '<',
        onChange: '&'
    },
    templateUrl: 'app/input/checkbox.component.html'
});

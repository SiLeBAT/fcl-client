'use strict';

/*global angular*/

angular.module('app').component('valueSelect', {
    bindings: {
        label: '@',
        values: '<',
        selectedValue: '<',
        onChange: '&'
    },
    templateUrl: 'app/input/value_select.component.html'
});

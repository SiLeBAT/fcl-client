'use strict';

/*global angular*/

angular.module('app').component('valueSelect', {
    bindings: {
        label: '@',
        values: '<',
        selectedValue: '<',
        onChange: '&'
    },
    templateUrl: 'app/graph/value_select.component.html'
});

'use strict';

/*global angular*/

angular.module('app').component('tableSettings', {
    bindings: {
        showTraceOnly: '<',
        onToggle: '&'
    },
    templateUrl: 'app/data/table_settings.component.html'
});
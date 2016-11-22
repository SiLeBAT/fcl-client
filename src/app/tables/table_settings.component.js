'use strict';

/*global angular*/

angular.module('app').component('tableSettings', {
    bindings: {
        showTraceOnly: '<',
        onChange: '&'
    },
    templateUrl: 'app/tables/table_settings.component.html'
});

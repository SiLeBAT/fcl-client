'use strict';

/*global angular*/

angular.module('app').component('tableSettings', {
    bindings: {
        settings: '<',
        onChange: '&'
    },
    controller: function (dataService) {
        let _this = this;

        _this.modes = dataService.TABLE_MODES;
    },
    templateUrl: 'app/settings/table_settings.component.html'
});

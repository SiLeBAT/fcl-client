'use strict';

/*global angular*/

angular.module('app').component('test', {
    bindings: {},
    controller: function() {},
    template: '' +
        '<div class="container" layout="row" flex>' +
        '   <md-sidenav md-component-id="sidenav" class="md-whiteframe-4dp" md-is-locked-open="$mdMedia(\'gt-sm\')" flex>' +
        '       <label>Station Size</label>' +
        '   </md-sidenav>' +
        '</div>'
});
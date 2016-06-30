'use strict';

/*global angular*/

angular.module('app').component('settings', {
    bindings: {
        nodeSize: '<',
        onChange: '&'
    },
    controller: function() {
        this.nodeSizes = {
            Small: 50,
            Large: 100
        };
    },
    template: '' +
        '<md-content layout-fill>' +
        '   <md-input-container class="md-block">' +
        '       <label>Station Size</label>' +
        '       <md-select ng-model="$ctrl.nodeSize" ng-change="$ctrl.onChange({property: \'nodeSize\', value: $ctrl.nodeSize})">' +
        '           <md-option ng-repeat="(label, value) in $ctrl.nodeSizes" value="{{value}}">' +
        '               {{label}}' +
        '           </md-option>' +
        '       </md-select>' +
        '   </md-input-container>' +
        '</md-content>'
});
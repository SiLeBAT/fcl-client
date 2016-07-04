'use strict';

/*global angular*/

angular.module('app').component('settings', {
    bindings: {
        nodeSize: '<',
        fontSize: '<',
        onChange: '&'
    },
    controller: function() {
        var ctrl = this;

        ctrl.nodeSizes = {
            Small: 50,
            Large: 100
        };

        ctrl.fontSizes = {
            Small: 12,
            Large: 18
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
        '   <md-input-container class="md-block">' +
        '       <label>Font Size</label>' +
        '       <md-select ng-model="$ctrl.fontSize" ng-change="$ctrl.onChange({property: \'fontSize\', value: $ctrl.fontSize})">' +
        '           <md-option ng-repeat="(label, value) in $ctrl.fontSizes" value="{{value}}">' +
        '               {{label}}' +
        '           </md-option>' +
        '       </md-select>' +
        '   </md-input-container>' +
        '</md-content>'
});
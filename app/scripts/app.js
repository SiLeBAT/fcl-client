'use strict';

/*global angular*/

angular.module('app', ['ngMaterial', 'ngComponentRouter'])
    .config(function($mdIconProvider, $mdThemingProvider) {
        $mdIconProvider.icon('menu', './icons/ic_menu_white_24px.svg', 24);
        $mdThemingProvider.theme('default').primaryPalette('indigo').accentPalette('blue');
    }).value('$routerRootComponent', 'app')
    .component('app', {
        $routeConfig: [{
            path: '/',
            component: 'main',
            name: 'Main'
        }, {
            path: '/test',
            component: 'test',
            name: 'Test'
        }],
        controller: function($mdSidenav) {
            this.toogleList = function() {
                $mdSidenav('sidenav').toggle();
            };
        },
        template: '' +
            '<div class="container" layout="column">' +
            '   <md-toolbar layout="row" class="md-whiteframe-4dp">' +
            '       <md-button class="menu" aria-label="Menu" ng-click="$ctrl.toogleList()" hide-gt-sm>' +
            '           <md-icon md-svg-icon="menu"></md-icon>' +
            '       </md-button>' +
            '       <md-button ng-link="[\'Main\']">Eins</md-button>' +
            '       <md-button ng-link="[\'Test\']">Zwei</md-button>' +
            '       <div class="md-toolbar-tools">' +
            '           <span>FoodChain-Lab</span>' +
            '       </div>' +
            '   </md-toolbar>' +
            '   <ng-outlet></ng-outlet>' +
            '</div>'
    });

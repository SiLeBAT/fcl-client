'use strict';

/*global angular*/

angular.module('app', ['ngMaterial', 'ui.router', 'ngResource', 'md.data.table'])
    .config(function($mdIconProvider, $mdThemingProvider) {
        $mdIconProvider.icon('close', './icons/ic_close_white_24px.svg', 24);
        $mdThemingProvider.theme('default').primaryPalette('indigo').accentPalette('red');
        $mdThemingProvider.theme('inverse').primaryPalette('indigo').accentPalette('red').dark();
    }).config(function($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('graph', {
                url: '/',
                template: '<graph-view></graph-view>'
            })
            .state('table', {
                url: '/table',
                template: '<table-view></table-view>'
            })
            .state('split', {
                url: '/split',
                template: '<split-view></split-view>'
            });

        $urlRouterProvider.otherwise('/');
    });

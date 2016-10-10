'use strict';

/*global angular*/

angular.module('app', ['ngMaterial', 'ui.router', 'ngResource', 'md.data.table'])
    .config(function($mdIconProvider, $mdThemingProvider) {
        $mdIconProvider.icon('close', './icons/ic_close_white_24px.svg', 24);
        $mdThemingProvider.theme('default').primaryPalette('indigo').accentPalette('blue');
    }).config(function($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('graph', {
                url: '/',
                template: '<settings></settings>'
            })
            .state('stations', {
                url: '/stations',
                template: '<stations></stations>'
            })
            .state('deliveries', {
                url: '/deliveries',
                template: '<deliveries></deliveries>'
            });

        $urlRouterProvider.otherwise('/');
    });

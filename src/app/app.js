'use strict';

/*global angular*/

angular.module('app', ['ngMaterial', 'ui.router', 'ngResource'])
    .config(function($mdIconProvider, $mdThemingProvider) {
        $mdIconProvider.icon('menu', './icons/ic_menu_white_24px.svg', 24);
        $mdIconProvider.icon('close', './icons/ic_close_white_24px.svg', 24);
        $mdThemingProvider.theme('default').primaryPalette('indigo').accentPalette('blue');
    }).config(function($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('graph', {
                url: '/',
                views: {
                    'toolbar': {
                        template: '<toolbar></toolbar>'
                    },
                    'content': {
                        template: '<graph></graph>'
                    }
                }

            })
            .state('test', {
                url: '/test',
                views: {
                    'toolbar': {
                        template: '<toolbar></toolbar>'
                    },
                    'content': {
                        template: '<test></test>'
                    }
                }
            });

        $urlRouterProvider.otherwise('/');
    });

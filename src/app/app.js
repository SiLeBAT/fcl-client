'use strict';

/*global angular*/

angular.module('app', ['ngMaterial', 'ui.router', 'ngResource', 'md.data.table'])
    .config(function($mdIconProvider, $mdThemingProvider) {
        var primary = 'indigo';
        var accent = 'pink';
        var warn = 'red';
        var background = 'grey';

        $mdThemingProvider.theme('default').primaryPalette(primary).accentPalette(accent).warnPalette(warn).backgroundPalette(background);
        $mdThemingProvider.theme('dark').primaryPalette(primary).accentPalette(accent).warnPalette(warn).backgroundPalette(background).dark();
        $mdIconProvider.icon('close', './icons/ic_close_white_24px.svg', 24);
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

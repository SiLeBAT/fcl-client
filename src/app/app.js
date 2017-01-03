'use strict';

/*global angular*/

angular.module('app', ['ngMaterial', 'ngResource', 'md.data.table'])
    .config(function($mdIconProvider, $mdThemingProvider) {
        var primary = 'indigo';
        var accent = 'pink';
        var warn = 'red';
        var background = 'grey';

        $mdThemingProvider.theme('default').primaryPalette(primary).accentPalette(accent).warnPalette(warn).backgroundPalette(background);
        $mdThemingProvider.theme('dark').primaryPalette(primary).accentPalette(accent).warnPalette(warn).backgroundPalette(background).dark();
        $mdIconProvider.icon('close', './icons/ic_close_white_24px.svg', 24);
        $mdIconProvider.icon('menu', './icons/ic_menu_white_24px.svg', 24);
    });

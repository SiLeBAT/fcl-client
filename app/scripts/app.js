'use strict';

/*global angular*/

angular.module('app', ['ngMaterial']).config(function($mdIconProvider) {
    $mdIconProvider.icon('menu', './icons/ic_menu_black_24px.svg', 24);
});

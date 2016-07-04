'use strict';

/*global angular*/

angular.module('app').factory('dataProvider', function($resource) {
    return $resource('data/bbk.json');
});
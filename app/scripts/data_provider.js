'use strict';

/*global angular, btoa*/

angular.module('app').factory('dataProvider', function($resource) {
    // return $resource('data/bbk.json');
    return $resource('https://foodrisklabs.bfr.bund.de/busstop/rest/items/rdt_json', {}, {
        login: {
            method: 'GET',
            dataType: "jsonp",
            crossDomain: true,
            isArray: false,
            headers: {
                'Authentication': function() {
                    return btoa('bfr_test:Ifupofetu843');
                }
            }
        }
    });
});
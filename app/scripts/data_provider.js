'use strict';

/*global angular, btoa, $*/

angular.module('app').factory('dataProvider', function($resource) {
    var authent = btoa('bfr_test:Ifupofetu843');

    $.ajax({
        type: 'GET',
        url: 'https://foodrisklabs.bfr.bund.de/busstop/rest/items/rdt_json',
        //crossDomain: true,
        dataType: 'json',
        headers: {
            'Authentication': "Basic " + authent
        },
        success: function(responseData, textStatus, jqXHR) {
            console.log(responseData);
        },
        error: function(responseData, textStatus, errorThrown) {
            console.warn(responseData, textStatus, errorThrown);
        }
    });

    return $resource('data/bbk.json');
    // return $resource('https://foodrisklabs.bfr.bund.de/busstop/rest/items/rdt_json', {}, {
    //     login: {
    //         method: 'GET',
    //         dataType: "jsonp",
    //         isArray: false,
    //         headers: {
    //             'Authentication': function() {
    //                 return btoa('bfr_test:Ifupofetu843');
    //             }
    //         }
    //     }
    // });
});
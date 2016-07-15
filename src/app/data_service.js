'use strict';

/*global angular*/

angular.module('app').service('dataService', function($q, $resource) {

    var srvc = this;

    var data;

    srvc.getData = function() {
        return $q(function(resolve, reject) {
            if (data !== undefined) {
                resolve(data);
            }
            else {
                $resource('data/small_network.json').get(function(response) {
                    data = response;
                    resolve(data);
                }, function(error) {
                    reject(error);
                });
            }
        });
    };

    // var authent = btoa('bfr_test:Ifupofetu843');

    // $.ajax({
    //     type: 'GET',
    //     url: 'https://foodrisklabs.bfr.bund.de/busstop/rest/items/rdt_json',
    //     //crossDomain: true,
    //     dataType: 'json',
    //     headers: {
    //         'Authentication': "Basic " + authent
    //     },
    //     success: function(responseData, textStatus, jqXHR) {
    //         console.log(responseData);
    //     },
    //     error: function(responseData, textStatus, errorThrown) {
    //         console.warn(responseData, textStatus, errorThrown);
    //     }
    // });

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

'use strict';

/*global angular*/

angular.module('app').service('dataService', function($q, $resource) {

    var srvc = this;

    srvc.nodeSizes = {
        Small: 50,
        Large: 100
    };

    srvc.fontSizes = {
        Small: 12,
        Large: 18
    };

    var data;
    var nodeSize = srvc.nodeSizes.Small;
    var fontSize = srvc.fontSizes.Small;

    srvc.getData = function() {
        return $q(function(resolve, reject) {
            if (data !== undefined) {
                resolve(data);
            }
            else {
                $resource('data/small_network.json').get(function(response) {
                    data = preprocessData(response);
                    resolve(data);
                }, function(error) {
                    reject(error);
                });
            }
        });
    };

    srvc.getNodeSize = function() {
        return nodeSize;
    };

    srvc.setNodeSize = function(size) {
        nodeSize = size;
    };

    srvc.getFontSize = function() {
        return fontSize;
    };

    srvc.setFontSize = function(size) {
        fontSize = size;
    };

    var preprocessData = function(rawData) {
        rawData.deliveries.forEach(function(d) {
            d.data.from = [];
            d.data.to = [];
        });

        rawData.deliveriesRelations.forEach(function(r) {
            var from = rawData.deliveries.find(function(d) {
                return d.data.id === r.data.from;
            });
            var to = rawData.deliveries.find(function(d) {
                return d.data.id === r.data.to;
            });

            from.data.to = from.data.to.concat(r.data.to);
            to.data.from = to.data.from.concat(r.data.from);
        });

        return {
            stations: rawData.stations,
            deliveries: rawData.deliveries
        };
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

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
        var stationsById = {};
        var deliveriesById = {};

        rawData.stations.forEach(function(s) {
            s.data.in = [];
            s.data.out = [];
            stationsById[s.data.id] = s;
        });

        rawData.deliveries.forEach(function(d) {
            var source = stationsById[d.data.source];
            var target = stationsById[d.data.target];
            
            source.data.out = source.data.out.concat(d.data.target);
            target.data.in = target.data.in.concat(d.data.source);
            
            d.data.in = [];
            d.data.out = [];
            deliveriesById[d.data.id] = d;
        });

        rawData.deliveriesRelations.forEach(function(r) {
            var source = deliveriesById[r.data.source];
            var target = deliveriesById[r.data.target];

            source.data.out = source.data.out.concat(r.data.target);
            target.data.in = target.data.in.concat(r.data.source);
        });

        return {
            stations: rawData.stations,
            deliveries: rawData.deliveries
        };
    };

    // $.ajax({
    //     type: 'GET',
    //     url: 'https://foodrisklabs.bfr.bund.de/busstop/rest/items/rdt_json',
    //     crossDomain: true,
    //     dataType: 'json',
    //     headers: {
    //         'Authentication': "Basic " + btoa('bfr_test:Ifupofetu843')
    //     },
    //     success: function(responseData, textStatus, jqXHR) {
    //         console.log(responseData);
    //     },
    //     error: function(responseData, textStatus, errorThrown) {
    //         console.warn(responseData, textStatus, errorThrown);
    //     }
    // });

    // $resource('https://foodrisklabs.bfr.bund.de/busstop/rest/items/rdt_json', {}, {
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

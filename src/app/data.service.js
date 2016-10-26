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
    var mergeDeliveries = false;
    var showTraceOnly = false;

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

    srvc.getMergeDeliveries = function() {
        return mergeDeliveries;
    };

    srvc.setMergeDeliveries = function(merge) {
        mergeDeliveries = merge;
    };

    srvc.getShowTraceOnly = function() {
        return showTraceOnly;
    };

    srvc.setShowTraceOnly = function(traceOnly) {
        showTraceOnly = traceOnly;
    };

    var preprocessData = function(rawData) {
        var stationsById = {};
        var deliveriesById = {};

        for (let s of rawData.stations) {
            s.data.in = [];
            s.data.out = [];
            stationsById[s.data.id] = s;
        }

        for (let d of rawData.deliveries) {
            stationsById[d.data.source].data.out.push(d.data.id);
            stationsById[d.data.target].data.in.push(d.data.id);

            d.data.in = [];
            d.data.out = [];
            deliveriesById[d.data.id] = d;
        }

        for (let r of rawData.deliveriesRelations) {
            deliveriesById[r.data.source].data.out.push(r.data.target);
            deliveriesById[r.data.target].data.in.push(r.data.source);
        }

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

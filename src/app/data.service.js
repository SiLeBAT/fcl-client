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

    var _data;
    var _nodeSize = srvc.nodeSizes.Small;
    var _fontSize = srvc.fontSizes.Small;
    var _mergeDeliveries = false;
    var _showTraceOnly = false;

    srvc.getData = function() {
        return $q(function(resolve, reject) {
            if (_data !== undefined) {
                resolve(_data);
            }
            else {
                $resource('data/small_network.json').get(function(data) {
                    _data = preprocessData(data);
                    resolve(_data);
                }, function(error) {
                    reject(error);
                });
            }
        });
    };

    srvc.getNodeSize = function() {
        return _nodeSize;
    };

    srvc.setNodeSize = function(size) {
        _nodeSize = size;
    };

    srvc.getFontSize = function() {
        return _fontSize;
    };

    srvc.setFontSize = function(size) {
        _fontSize = size;
    };

    srvc.getMergeDeliveries = function() {
        return _mergeDeliveries;
    };

    srvc.setMergeDeliveries = function(merge) {
        _mergeDeliveries = merge;
    };

    srvc.getShowTraceOnly = function() {
        return _showTraceOnly;
    };

    srvc.setShowTraceOnly = function(traceOnly) {
        _showTraceOnly = traceOnly;
    };

    function preprocessData(data) {
        var stationsById = {};
        var deliveriesById = {};

        for (let s of data.stations) {
            s.data.in = [];
            s.data.out = [];
            stationsById[s.data.id] = s;
        }

        for (let d of data.deliveries) {
            stationsById[d.data.source].data.out.push(d.data.id);
            stationsById[d.data.target].data.in.push(d.data.id);

            d.data.in = [];
            d.data.out = [];
            deliveriesById[d.data.id] = d;
        }

        for (let r of data.deliveriesRelations) {
            deliveriesById[r.data.source].data.out.push(r.data.target);
            deliveriesById[r.data.target].data.in.push(r.data.source);
        }

        return {
            stations: data.stations,
            deliveries: data.deliveries
        };
    }

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

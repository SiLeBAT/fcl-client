'use strict';

/*global angular*/

angular.module('app').service('dataService', function($q, $resource) {

    var _this = this;

    _this.NODE_SIZES = {
        Small: 50,
        Large: 100
    };

    _this.FONT_SIZES = {
        Small: 12,
        Large: 18
    };

    _this.COLORS = {
        forward: [150, 255, 75],
        backward: [255, 200, 75],
        observed: [75, 150, 255],
        outbreak: [255, 50, 50]
    };

    var _data;
    var _nodeSize = _this.NODE_SIZES.Small;
    var _fontSize = _this.FONT_SIZES.Small;
    var _mergeDeliveries = false;
    var _showTraceOnly = false;

    _this.getData = function() {
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

    _this.getNodeSize = function() {
        return _nodeSize;
    };

    _this.setNodeSize = function(size) {
        _nodeSize = size;
    };

    _this.getFontSize = function() {
        return _fontSize;
    };

    _this.setFontSize = function(size) {
        _fontSize = size;
    };

    _this.getMergeDeliveries = function() {
        return _mergeDeliveries;
    };

    _this.setMergeDeliveries = function(merge) {
        _mergeDeliveries = merge;
    };

    _this.getShowTraceOnly = function() {
        return _showTraceOnly;
    };

    _this.setShowTraceOnly = function(traceOnly) {
        _showTraceOnly = traceOnly;
    };

    _this.colorToCss = function(color) {
        return 'rgb(' + color[0] + ', ' + color[1] + ', ' + color[2] + ')';
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

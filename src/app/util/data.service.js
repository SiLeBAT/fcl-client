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

    _this.TABLE_MODES = ['Stations', 'Deliveries'];
    _this.TABLE_COLUMNS = {
        'Stations': ['id', 'name', 'type', 'score'],
        'Deliveries': ['id', 'source', 'target', 'score']
    };

    var _data;
    var _settings = {
        leftSidenavOpen: false,
        rightSidenavOpen: false
    };
    var _graphSettings = {
        nodeSize: _this.NODE_SIZES.Small,
        fontSize: _this.FONT_SIZES.Small,
        mergeDeliveries: false
    };
    var _tableSettings = {
        mode: _this.TABLE_MODES[0],
        order: 'data.id',
        showAll: true,
        showSelected: true,
        showObserved: false,
        showTrace: false,
        showOutbreak: false
    };

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

    _this.getSettings = function() {
        return _settings;
    };

    _this.getGraphSettings = function() {
        return _graphSettings;
    };

    _this.getTableSettings = function() {
        return _tableSettings;
    };

    function preprocessData(data) {
        var stationsById = {};
        var deliveriesById = {};

        for (let s of data.stations) {
            s.data.isEdge = false;
            s.data.in = [];
            s.data.out = [];
            stationsById[s.data.id] = s;
        }

        for (let d of data.deliveries) {
            stationsById[d.data.source].data.out.push(d.data.id);
            stationsById[d.data.target].data.in.push(d.data.id);

            d.data.isEdge = true;
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

});

'use strict';

/*global angular*/

angular.module('app').service('tracingService', function() {

    var _this = this;

    var _stations;
    var _deliveries;
    var _elementsById;

    _this.init = function(data) {
        _stations = data.stations;
        _deliveries = data.deliveries;
        _elementsById = {};

        for (let s of _stations) {
            _elementsById[s.data.id] = s;
        }

        for (let d of _deliveries) {
            _elementsById[d.data.id] = d;
        }
    };

    _this.getElementsById = function(ids) {
        return ids.map(function(id) {
            return _elementsById[id];
        });
    };

    _this.mergeStations = function(ids, name) {
        var metaId;

        for (let i = 1;; i++) {
            if (_elementsById[i] === undefined) {
                metaId = i.toString();
                break;
            }
        }

        var metaStation = {
            data: {
                id: metaId,
                name: name,
                type: 'Meta Station',
                contains: ids
            }
        };

        for (let id of ids) {
            _elementsById[id].data.containedIn = metaId;
        }

        metaStation.data.in = [];
        metaStation.data.out = [];

        for (let d of _deliveries) {
            if (ids.includes(d.data.source)) {
                d.data.originalSource = d.data.source;
                d.data.source = metaId;
                metaStation.data.out.push(d.data.id);
            }

            if (ids.includes(d.data.target)) {
                d.data.originalTarget = d.data.target;
                d.data.target = metaId;
                metaStation.data.in.push(d.data.id);
            }
        }

        _stations.push(metaStation);
        _elementsById[metaId] = metaStation;
    };

    _this.expandStation = function(id) {
        var station = _elementsById[id];

        _elementsById[id] = undefined;
        _stations.splice(_stations.indexOf(station), 1);

        for (let containedId of station.data.contains) {
            _elementsById[containedId].data.containedIn = undefined;
        }

        for (let d of _deliveries) {
            if (d.data.source === id) {
                d.data.source = d.data.originalSource;
                d.data.originalSource = undefined;
            }

            if (d.data.target === id) {
                d.data.target = d.data.originalTarget;
                d.data.originalTarget = undefined;
            }
        }
    };

    _this.clearSelection = function() {
        for (let s of _stations) {
            s.data.selected = false;
        }
        for (let d of _deliveries) {
            d.data.selected = false;
        }
    };

    _this.setSelected = function(id, selected) {
        _elementsById[id].data.selected = selected;
    };

    _this.clearOutbreakStations = function() {
        for (let s of _stations) {
            s.data.outbreak = false;
            s.data.score = 0;
        }
        for (let d of _deliveries) {
            d.data.score = 0;
        }
    };

    _this.toggleOutbreakStation = function(id) {
        var station = _elementsById[id];

        station.data.outbreak = !station.data.outbreak;
        updateScores();
    };

    _this.clearTrace = function() {
        for (let s of _stations) {
            s.data.observed = false;
            s.data.forward = false;
            s.data.backward = false;
        }
        for (let d of _deliveries) {
            d.data.observed = false;
            d.data.forward = false;
            d.data.backward = false;
        }
    };

    _this.showStationTrace = function(id) {
        var station = _elementsById[id];

        _this.clearTrace();
        station.data.observed = true;
        station.data.out.forEach(showDeliveryForwardTraceInternal);
        station.data.in.forEach(showDeliveryBackwardTraceInternal);
    };

    _this.showStationForwardTrace = function(id) {
        var station = _elementsById[id];

        _this.clearTrace();
        station.data.observed = true;
        station.data.out.forEach(showDeliveryForwardTraceInternal);
    };

    _this.showStationBackwardTrace = function(id) {
        var station = _elementsById[id];

        _this.clearTrace();
        station.data.observed = true;
        station.data.in.forEach(showDeliveryBackwardTraceInternal);
    };

    _this.showDeliveryTrace = function(id) {
        var delivery = _elementsById[id];

        _this.clearTrace();
        delivery.data.observed = true;
        _elementsById[delivery.data.target].data.forward = true;
        _elementsById[delivery.data.source].data.backward = true;
        delivery.data.out.forEach(showDeliveryForwardTraceInternal);
        delivery.data.in.forEach(showDeliveryBackwardTraceInternal);
    };

    _this.showDeliveryForwardTrace = function(id) {
        var delivery = _elementsById[id];

        _this.clearTrace();
        delivery.data.observed = true;
        _elementsById[delivery.data.target].data.forward = true;
        delivery.data.out.forEach(showDeliveryForwardTraceInternal);
    };

    _this.showDeliveryBackwardTrace = function(id) {
        var delivery = _elementsById[id];

        _this.clearTrace();
        delivery.data.observed = true;
        _elementsById[delivery.data.source].data.backward = true;
        delivery.data.in.forEach(showDeliveryBackwardTraceInternal);
    };

    function updateScores() {
        var nOutbreaks = 0;

        for (let s of _stations) {
            s.data.score = 0;
        }

        for (let d of _deliveries) {
            d.data.score = 0;
        }

        for (let s of _stations) {
            if (s.data.outbreak === true) {
                nOutbreaks++;
                updateStationScore(s.data.id, s.data.id);
            }
        }

        if (nOutbreaks !== 0) {
            for (let s of _stations) {
                s.data.score /= nOutbreaks;
                s.data._visited = undefined;
            }

            for (let d of _deliveries) {
                d.data.score /= nOutbreaks;
                d.data._visited = undefined;
            }
        }
    }

    function updateStationScore(id, outbreakId) {
        var station = _elementsById[id];

        if (station.data._visited !== outbreakId) {
            station.data._visited = outbreakId;
            station.data.score++;

            for (let d of station.data.in) {
                updateDeliveryScore(d, outbreakId);
            }
        }
    }

    function updateDeliveryScore(id, outbreakId) {
        var delivery = _elementsById[id];

        if (delivery.data._visited !== outbreakId) {
            delivery.data._visited = outbreakId;
            delivery.data.score++;

            var source = _elementsById[delivery.data.source];

            if (source.data._visited !== outbreakId) {
                source.data._visited = outbreakId;
                source.data.score++;
            }

            for (let d of delivery.data.in) {
                updateDeliveryScore(d, outbreakId);
            }
        }
    }

    function showDeliveryForwardTraceInternal(id) {
        var delivery = _elementsById[id];

        if (delivery.data.forward !== true) {
            delivery.data.forward = true;
            _elementsById[delivery.data.target].data.forward = true;
            delivery.data.out.forEach(showDeliveryForwardTraceInternal);
        }
    }

    function showDeliveryBackwardTraceInternal(id) {
        var delivery = _elementsById[id];

        if (delivery.data.backward !== true) {
            delivery.data.backward = true;
            _elementsById[delivery.data.source].data.backward = true;
            delivery.data.in.forEach(showDeliveryBackwardTraceInternal);
        }
    }
});

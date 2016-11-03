'use strict';

/*global angular*/

angular.module('app').service('tracingService', function() {

    var _this = this;

    var _stations;
    var _deliveries;
    var _stationsById;
    var _deliveriesById;

    _this.init = function(data) {
        _stations = data.stations;
        _deliveries = data.deliveries;
        _stationsById = {};
        _deliveriesById = {};

        for (let s of _stations) {
            _stationsById[s.data.id] = s;
        }

        for (let d of _deliveries) {
            _deliveriesById[d.data.id] = d;
        }
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
        var station = _stationsById[id];

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

    _this.showStationForwardTrace = function(id) {
        var station = _stationsById[id];

        station.data.observed = true;
        station.data.out.forEach(showDeliveryForwardTraceInternal);
    };

    _this.showStationBackwardTrace = function(id) {
        var station = _stationsById[id];

        station.data.observed = true;
        station.data.in.forEach(showDeliveryBackwardTraceInternal);
    };

    _this.showDeliveryForwardTrace = function(id) {
        var delivery = _deliveriesById[id];

        delivery.data.observed = true;
        _stationsById[delivery.data.target].data.forward = true;
        delivery.data.out.forEach(showDeliveryForwardTraceInternal);
    };

    _this.showDeliveryBackwardTrace = function(id) {
        var delivery = _deliveriesById[id];

        delivery.data.observed = true;
        _stationsById[delivery.data.source].data.backward = true;
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
        var station = _stationsById[id];

        if (station.data._visited !== outbreakId) {
            station.data._visited = outbreakId;
            station.data.score++;

            for (let d of station.data.in) {
                updateDeliveryScore(d, outbreakId);
            }
        }
    }

    function updateDeliveryScore(id, outbreakId) {
        var delivery = _deliveriesById[id];

        if (delivery.data._visited !== outbreakId) {
            delivery.data._visited = outbreakId;
            delivery.data.score++;

            var source = _stationsById[delivery.data.source];

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
        var delivery = _deliveriesById[id];

        if (delivery.data.forward !== true) {
            delivery.data.forward = true;
            _stationsById[delivery.data.target].data.forward = true;
            delivery.data.out.forEach(showDeliveryForwardTraceInternal);
        }
    }

    function showDeliveryBackwardTraceInternal(id) {
        var delivery = _deliveriesById[id];

        if (delivery.data.backward !== true) {
            delivery.data.backward = true;
            _stationsById[delivery.data.source].data.backward = true;
            delivery.data.in.forEach(showDeliveryBackwardTraceInternal);
        }
    }
});

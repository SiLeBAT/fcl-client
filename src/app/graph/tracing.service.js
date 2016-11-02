'use strict';

/*global angular*/

angular.module('app').service('tracingService', function() {

    var comp = this;

    var stations;
    var deliveries;

    var stationsById;
    var deliveriesById;

    comp.init = function(data) {
        stations = data.stations;
        deliveries = data.deliveries;
        stationsById = {};
        deliveriesById = {};

        for (let s of stations) {
            stationsById[s.data.id] = s;
        }

        for (let d of deliveries) {
            deliveriesById[d.data.id] = d;
        }
    };

    comp.toggleOutbreakStation = function(id) {
        var station = stationsById[id];

        station.data.outbreak = !station.data.outbreak;
        updateScores();
        
        for (let s of stations) {
            console.log(s.data.score);
        }
    };

    comp.clearTrace = function() {
        for (let s of stations) {
            s.data.observed = false;
            s.data.forward = false;
            s.data.backward = false;
        }
        for (let d of deliveries) {
            d.data.observed = false;
            d.data.forward = false;
            d.data.backward = false;
        }
    };

    comp.showStationForwardTrace = function(id) {
        var station = stationsById[id];

        station.data.observed = true;
        station.data.out.forEach(showDeliveryForwardTraceInternal);
    };

    comp.showStationBackwardTrace = function(id) {
        var station = stationsById[id];

        station.data.observed = true;
        station.data.in.forEach(showDeliveryBackwardTraceInternal);
    };

    comp.showDeliveryForwardTrace = function(id) {
        var delivery = deliveriesById[id];

        delivery.data.observed = true;
        stationsById[delivery.data.target].data.forward = true;
        delivery.data.out.forEach(showDeliveryForwardTraceInternal);
    };

    comp.showDeliveryBackwardTrace = function(id) {
        var delivery = deliveriesById[id];

        delivery.data.observed = true;
        stationsById[delivery.data.source].data.backward = true;
        delivery.data.in.forEach(showDeliveryBackwardTraceInternal);
    };

    var updateScores = function() {
        var nOutbreaks = 0;

        for (let s of stations) {
            s.data.score = 0;
        }

        for (let d of deliveries) {
            d.data.score = 0;
        }

        for (let s of stations) {
            if (s.data.outbreak === true) {
                nOutbreaks++;
                updateStationScore(s.data.id, s.data.id);
            }
        }

        if (nOutbreaks !== 0) {
            for (let s of stations) {
                s.data.score /= nOutbreaks;
                s.data.visited = undefined;
            }

            for (let d of deliveries) {
                d.data.score /= nOutbreaks;
                d.data.visited = undefined;
            }
        }
    };

    var updateStationScore = function(id, outbreakId) {
        var station = stationsById[id];

        if (station.data.visited !== outbreakId) {
            station.data.visited = outbreakId;
            station.data.score++;

            for (let d of station.data.in) {
                updateDeliveryScore(d, outbreakId);
            }
        }
    };

    var updateDeliveryScore = function(id, outbreakId) {
        var delivery = deliveriesById[id];

        if (delivery.data.visited !== outbreakId) {
            delivery.data.visited = outbreakId;
            delivery.data.score++;

            var source = stationsById[delivery.data.source];

            if (source.data.visited !== outbreakId) {
                source.data.visited = outbreakId;
                source.data.score++;
            }

            for (let d of delivery.data.in) {
                updateDeliveryScore(d, outbreakId);
            }
        }
    };

    var showDeliveryForwardTraceInternal = function(id) {
        var delivery = deliveriesById[id];

        if (delivery.data.forward !== true) {
            delivery.data.forward = true;
            stationsById[delivery.data.target].data.forward = true;
            delivery.data.out.forEach(showDeliveryForwardTraceInternal);
        }
    };

    var showDeliveryBackwardTraceInternal = function(id) {
        var delivery = deliveriesById[id];

        if (delivery.data.backward !== true) {
            delivery.data.backward = true;
            stationsById[delivery.data.source].data.backward = true;
            delivery.data.in.forEach(showDeliveryBackwardTraceInternal);
        }
    };
});

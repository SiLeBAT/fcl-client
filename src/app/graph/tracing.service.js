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

        stations.forEach(function(s) {
            stationsById[s.data.id] = s;
        });

        deliveries.forEach(function(d) {
            deliveriesById[d.data.id] = d;
        });
    };

    comp.clearForwardTrace = function() {
        stations.forEach(function(s) {
            s.data.forward = false;
        });
        deliveries.forEach(function(d) {
            d.data.forward = false;
        });
    };

    comp.clearBackwardTrace = function() {
        stations.forEach(function(s) {
            s.data.backward = false;
        });
        deliveries.forEach(function(d) {
            d.data.backward = false;
        });
    };

    comp.showStationForwardTrace = function(id) {
        var station = stationsById[id];

        station.data.forward = true;
        station.data.out.forEach(function(d) {
            comp.showDeliveryForwardTrace(d);
        });
    };

    comp.showStationBackwardTrace = function(id) {
        var station = stationsById[id];

        station.data.backward = true;
        station.data.in.forEach(function(d) {
            comp.showDeliveryBackwardTrace(d);
        });
    };

    comp.showDeliveryForwardTrace = function(id) {
        var delivery = deliveriesById[id];

        delivery.data.forward = true;
        stationsById[delivery.data.target].data.forward = true;
        delivery.data.out.forEach(function(d) {
            comp.showDeliveryForwardTrace(d);
        });
    };

    comp.showDeliveryBackwardTrace = function(id) {
        var delivery = deliveriesById[id];

        delivery.data.backward = true;
        stationsById[delivery.data.source].data.backward = true;
        delivery.data.in.forEach(function(d) {
            comp.showDeliveryBackwardTrace(d);
        });
    };
});

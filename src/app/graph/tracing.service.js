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

    comp.clearTrace = function() {
        stations.forEach(function(s) {
            s.data.observed = false;
            s.data.forward = false;
            s.data.backward = false;
        });
        deliveries.forEach(function(d) {
            d.data.observed = false;
            d.data.forward = false;
            d.data.backward = false;
        });
    };

    comp.showStationForwardTrace = function(id) {
        var station = stationsById[id];

        station.data.observed = true;
        station.data.out.forEach(function(d) {
            showDeliveryForwardTraceInternal(d);
        });
    };

    comp.showStationBackwardTrace = function(id) {
        var station = stationsById[id];

        station.data.observed = true;
        station.data.in.forEach(function(d) {
            showDeliveryBackwardTraceInternal(d);
        });
    };

    comp.showDeliveryForwardTrace = function(id) {
        var delivery = deliveriesById[id];

        delivery.data.observed = true;
        stationsById[delivery.data.target].data.forward = true;
        delivery.data.out.forEach(function(d) {
            showDeliveryForwardTraceInternal(d);
        });
    };

    comp.showDeliveryBackwardTrace = function(id) {
        var delivery = deliveriesById[id];

        delivery.data.observed = true;
        stationsById[delivery.data.source].data.backward = true;
        delivery.data.in.forEach(function(d) {
            showDeliveryBackwardTraceInternal(d);
        });
    };

    var showDeliveryForwardTraceInternal = function(id) {
        var delivery = deliveriesById[id];

        delivery.data.forward = true;
        stationsById[delivery.data.target].data.forward = true;
        delivery.data.out.forEach(function(d) {
            showDeliveryForwardTraceInternal(d);
        });
    };

    var showDeliveryBackwardTraceInternal = function(id) {
        var delivery = deliveriesById[id];

        delivery.data.backward = true;
        stationsById[delivery.data.source].data.backward = true;
        delivery.data.in.forEach(function(d) {
            showDeliveryBackwardTraceInternal(d);
        });
    };
});

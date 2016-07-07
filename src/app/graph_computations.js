'use strict';

/*global angular, $*/

angular.module('app').service('graphComputations', function() {

    var comp = this;

    var cy;

    comp.init = function(cyGraph) {
        cy = cyGraph;
    };

    comp.clearForwardTrace = function() {
        cy.$().data('forward', false);
    };

    comp.showStationForwardTrace = function(station) {
        cy.$('#' + station.id()).data('forward', true);
        cy.$('edge[source = "' + station.id() + '"]').forEach(function(d) {
            comp.showDeliveryForwardTrace(d);
        });
    };

    comp.showDeliveryForwardTrace = function(delivery) {
        cy.$('#' + delivery.id()).data('forward', true);
        cy.$('#' + delivery.data('target')).data('forward', true);

        var to = delivery.data('to');

        cy.filter(function(i, e) {
            return e.isEdge() && to.includes(parseInt(e.id(), 10));
        }).forEach(function(d) {
            comp.showDeliveryForwardTrace(d);
        });
    };
});
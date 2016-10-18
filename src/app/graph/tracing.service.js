'use strict';

/*global angular*/

angular.module('app').service('tracingService', function() {

    var comp = this;

    var cy;

    comp.init = function(cytoscape) {
        cy = cytoscape;
    };

    comp.clearForwardTrace = function() {
        cy.$().data('forward', false);
    };

    comp.clearBackwardTrace = function() {
        cy.$().data('backward', false);
    };

    comp.showStationForwardTrace = function(station) {
        station.data('forward', true);
        cy.$('edge[source = "' + station.id() + '"]').forEach(function(d) {
            comp.showDeliveryForwardTrace(d);
        });
    };

    comp.showStationBackwardTrace = function(station) {
        station.data('backward', true);
        cy.$('edge[target = "' + station.id() + '"]').forEach(function(d) {
            comp.showDeliveryBackwardTrace(d);
        });
    };
    
    comp.showDeliveryForwardTrace = function(delivery) {
        delivery.data('forward', true);
        cy.$('#' + delivery.data('target')).data('forward', true);

        var outgoing = delivery.data('out');

        cy.filter(function(i, e) {
            return e.isEdge() && outgoing.includes(e.id());
        }).forEach(function(d) {
            comp.showDeliveryForwardTrace(d);
        });
    };

    comp.showDeliveryBackwardTrace = function(delivery) {
        delivery.data('backward', true);
        cy.$('#' + delivery.data('source')).data('backward', true);

        var incoming = delivery.data('in');

        cy.filter(function(i, e) {
            return e.isEdge() && incoming.includes(e.id());
        }).forEach(function(d) {
            comp.showDeliveryBackwardTrace(d);
        });
    };
});

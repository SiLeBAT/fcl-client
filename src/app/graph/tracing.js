'use strict';

/*global angular*/

angular.module('app').service('tracing', function() {

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

        var to = delivery.data('to');

        cy.filter(function(i, e) {
            return e.isEdge() && to.includes(e.id());
        }).forEach(function(d) {
            comp.showDeliveryForwardTrace(d);
        });
    };

    comp.showDeliveryBackwardTrace = function(delivery) {
        delivery.data('backward', true);
        cy.$('#' + delivery.data('source')).data('backward', true);

        var from = delivery.data('from');

        cy.filter(function(i, e) {
            return e.isEdge() && from.includes(e.id());
        }).forEach(function(d) {
            comp.showDeliveryBackwardTrace(d);
        });
    };
});

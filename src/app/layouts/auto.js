'use strict';

/*global cytoscape, dagre*/

var register = function(cytoscape) {

    var defaults = {
        nodeSep: undefined,
        edgeSep: undefined,
        rankSep: undefined,
        rankDir: undefined,
        minLen: function(edge) {
            return 1;
        },
        edgeWeight: function(edge) {
            return 1;
        },

        fit: true,
        padding: 30,
        animate: false,
        animationDuration: 500,
        animationEasing: undefined,
        boundingBox: undefined,
        ready: function() {},
        stop: function() {}
    };

    function AutoLayout(options) {
        var opts = this.options = {};
        for (var i in defaults) {
            opts[i] = defaults[i];
        }
        for (var i in options) {
            opts[i] = options[i];
        }
    }

    AutoLayout.prototype.run = function() {
        var options = this.options;

        var cy = options.cy;

        cy.layout({
            name: 'spread',
            maxExpandIterations: 0,
            ready: function() {
                // cy.layout({
                //     name: 'cola',
                //     ungrabifyWhileSimulating: false,
                //     avoidOverlap: false,
                //     animate: true,
                //     maxSimulationTime: 20000
                // });
            }
        });

        return this;
    };

    cytoscape('layout', 'auto', AutoLayout);
};

register(cytoscape);

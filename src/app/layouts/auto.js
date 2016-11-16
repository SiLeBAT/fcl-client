'use strict';

/*global cytoscape*/

var register = function(cytoscape) {

    var defaults = {
        animate: false
    };

    function AutoLayout(options) {
        var opts = this.options = {};

        for (let i in defaults) {
            opts[i] = defaults[i];
        }

        for (let i in options) {
            opts[i] = options[i];
        }
    }

    AutoLayout.prototype.run = function() {
        var options = this.options;
        var cy = options.cy;

        cy.layout({
            name: 'spread',
            animate: false,
            randomize: true,
            maxExpandIterations: 0,
            ready: function() {
                cy.layout({
                    name: 'cola',
                    ungrabifyWhileSimulating: false,
                    avoidOverlap: false,
                    animate: options.animate,
                    maxSimulationTime: 5000,
                });
            }
        });

        return this;
    };

    cytoscape('layout', 'auto', AutoLayout);
};

register(cytoscape);

'use strict';

/*global angular, cytoscape, $*/

angular.module('app').factory('graph', ['$q', function($q) {

  var cy;

  var graph = function(nodes, edges) {
    var deferred = $q.defer();
    var graphElements = [];
    var i;

    for (i = 0; i < nodes.length; i++) {
      graphElements.push({
        group: 'nodes',
        data: {
          id: nodes[i].id,
          name: nodes[i].name,
          type: nodes[i].type
        }
      });
    }

    for (i = 0; i < edges.length; i++) {
      graphElements.push({
        group: 'edges',
        data: {
          id: edges[i].id,
          source: edges[i].source,
          target: edges[i].target
        }
      });
    }

    cy = cytoscape({
      container: $('#cy')[0],

      style: cytoscape.stylesheet()
        .selector('node')
        .css({
          'content': 'data(name)',
          'height': '50',
          'width': '50',
          'text-valign': 'center',
          'color': 'white',
          'text-outline-width': 2,
          'text-outline-color': '#888'
        })
        .selector('edge')
        .css({
          'target-arrow-shape': 'triangle',
          'width': 4,
          'line-color': '#ddd',
          'target-arrow-color': '#ddd',
          'curve-style': 'bezier'
        })
        .selector(':selected')
        .css({
          'background-color': 'black',
          'line-color': 'black',
          'target-arrow-color': 'black',
          'source-arrow-color': 'black',
          'text-outline-color': 'black'
        }),

      layout: {
        name: 'cose',
        padding: 10
      },

      minZoom: 0.5,
      maxZoom: 2,
      zoomingEnabled: true,

      elements: graphElements,

      ready: function() {
        deferred.resolve(this);

        cy.on('zoom', function(event) {
          cy.nodes().css({
            'font-size': Math.max(12 / cy.zoom(), 12)
          });
        });
      }
    });

    return deferred.promise;
  };

  graph.setNodeWeight = function(id, weight) {
    cy.$('#' + id).data('weight', weight);
  };

  return graph;

}]);
'use strict';

/*global angular, cytoscape, $, console*/

angular.module('app').factory('graph', function($q) {

  var cy;

  var graph = function(nodes, edges) {
    var deferred = $q.defer();

    cy = cytoscape({
      container: $('#graph')[0],

      style: cytoscape.stylesheet()
        .selector('node')
        .css({
          'content': 'data(name)',
          'height': '50',
          'width': '50',
          'background-color': '#FFFFFF',
          'border-width': 3,
          'border-color': '#000000',
          'text-valign': 'bottom',
          'text-halign': 'right',
          'color': '#000000'
        })
        .selector('edge')
        .css({
          'target-arrow-shape': 'triangle',
          'width': 6,
          'line-color': '#000000',
          'target-arrow-color': '#FF0000',
          'curve-style': 'bezier'
        })
        .selector('node:selected')
        .css({
          'background-color': '#9999FF',
          'border-width': 6,
          'border-color': '#0000FF',
          'color': '#0000FF'
        })
        .selector('edge:selected')
        .css({
          'width': 12,
          'line-color': '#00FF00',
          'target-arrow-color': '#FF0000'
        }),

      layout: {
        name: 'cose'
      },

      elements: {
        nodes: nodes,
        edges: edges
      },

      // initial viewport state:
      zoom: 1,
      pan: {
        x: 0,
        y: 0
      },

      // interaction options:
      minZoom: 0.3,
      maxZoom: 3,

      // rendering options:
      wheelSensitivity: 0.5,

      ready: function() {
        deferred.resolve(this);

        cy.on('zoom', function(event) {
          console.log(cy.zoom());
          cy.nodes().css({
            'font-size': Math.max(12 / cy.zoom(), 12)
          });
        });
      }
    });

    return deferred.promise;
  };

  graph.setNodeSize = function(size) {
    cy.nodes().css({
      'height': size,
      'width': size
    });
  };

  return graph;

});
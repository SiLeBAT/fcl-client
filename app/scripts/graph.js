'use strict';

/*global angular, cytoscape, $, console*/

angular.module('app').service('graph', function() {

  var graph = this;

  var cy;

  var fontSize = 12;

  graph.init = function(nodes, edges) {
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
        graph.setFontSize(fontSize);
      }

    });

    cy.on('zoom', function(event) {
      graph.setFontSize(fontSize);
    });

    cy.cxtmenu({
      selector: 'node',
      commands: [{
        content: 'bg1',
        select: function() {
          console.log('bg1');
        }
      }, {
        content: 'bg2',
        select: function() {
          console.log('bg2');
        }
      }, {
        content: 'bg3',
        select: function() {
          console.log('bg3');
        }
      }, {
        content: 'bg4',
        select: function() {
          console.log('bg4');
        }
      }, {
        content: 'bg5',
        select: function() {
          console.log('bg5');
        }
      }]
    });

    cy.cxtmenu({
      selector: 'edge',
      commands: [{
        content: 'bg1',
        select: function() {
          console.log('bg1');
        }
      }, {
        content: 'bg2',
        select: function() {
          console.log('bg2');
        }
      }, {
        content: 'bg3',
        select: function() {
          console.log('bg3');
        }
      }, {
        content: 'bg4',
        select: function() {
          console.log('bg4');
        }
      }]
    });

    cy.cxtmenu({
      selector: 'core',
      commands: [{
        content: 'bg1',
        select: function() {
          console.log('bg1');
        }
      }, {
        content: 'bg2',
        select: function() {
          console.log('bg2');
        }
      }, {
        content: 'bg3',
        select: function() {
          console.log('bg3');
        }
      }, {
        content: 'bg4',
        select: function() {
          console.log('bg4');
        }
      }, {
        content: 'bg5',
        select: function() {
          console.log('bg5');
        }
      }, {
        content: 'bg6',
        select: function() {
          console.log('bg6');
        }
      }, {
        content: 'bg7',
        select: function() {
          console.log('bg7');
        }
      }]
    });
  };

  graph.setNodeSize = function(size) {
    cy.nodes().css({
      'height': size,
      'width': size
    });
  };

  graph.setFontSize = function(size) {
    fontSize = size;

    cy.nodes().css({
      'font-size': Math.max(fontSize / cy.zoom(), fontSize)
    });
  };

});
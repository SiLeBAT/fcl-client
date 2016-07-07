'use strict';

/*global angular, cytoscape, $*/

angular.module('app').service('graph', function(graphComputations) {

  var graph = this;

  var cy;

  var fontSize;

  graph.init = function(data) {
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
          'background-color': '#8080FF',
          'border-width': 6,
          'border-color': '#0000FF',
          'color': '#0000FF'
        })
        .selector('edge:selected')
        .css({
          'width': 12,
          'line-color': '#00FF00',
          'target-arrow-color': '#FF0000'
        }).selector('node[?forward]')
        .css({
          'background-color': '#00FF00'
        }).selector('node:selected[?forward]')
        .css({
          'background-color': '#008080'
        }).selector('edge[?forward]')
        .css({
          'line-color': '#00FF00'
        }),

      layout: {
        name: 'cose'
      },

      elements: {
        nodes: data.stations,
        edges: data.deliveries
      },

      zoom: 1,
      pan: {
        x: 0,
        y: 0
      },

      minZoom: 0.3,
      maxZoom: 3,

      wheelSensitivity: 0.5,

      ready: function() {
        graph.setFontSize(12);
      }
    });

    cy.on('zoom', function(event) {
      graph.setFontSize(fontSize);
    });

    cy.cxtmenu({
      selector: 'node',
      commands: [{
        content: 'Show Forward Trace',
        select: function(station) {
          cy.batch(function() {
            graphComputations.clearForwardTrace();
            graphComputations.showStationForwardTrace(station);
          });
        }
      }, {
        content: 'bg2',
        select: function() {
        }
      }, {
        content: 'bg3',
        select: function() {
        }
      }, {
        content: 'bg4',
        select: function() {
        }
      }]
    });

    cy.cxtmenu({
      selector: 'edge',
      commands: [{
        content: 'bg1',
        select: function() {
        }
      }, {
        content: 'bg2',
        select: function() {
        }
      }, {
        content: 'bg3',
        select: function() {
        }
      }]
    });

    cy.cxtmenu({
      selector: 'core',
      commands: [{
        content: 'bg1',
        select: function() {
        }
      }, {
        content: 'bg2',
        select: function() {
        }
      }]
    });
    
    graphComputations.init(data, cy);
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
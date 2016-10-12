'use strict';

/*global angular, cytoscape, $*/

angular.module('app').service('graphService', function(tracingService, $mdDialog) {

  var graph = this;

  var cy;
  var fontSize;

  graph.init = function(data) {
    if (cy === undefined) {
      cy = cytoscape({
        container: $('#graph')[0],

        elements: {
          nodes: data.stations,
          edges: data.deliveries
        },

        layout: {
          name: 'cose-bilkent'
        },

        style: style,
        minZoom: 0.1,
        maxZoom: 10,
        wheelSensitivity: 0.5,
      });
    }
    else {
      var json = cy.json();

      cy = cytoscape({
        container: $('#graph')[0],

        elements: {
          nodes: data.stations,
          edges: data.deliveries
        },

        layout: {
          name: 'preset',
          positions: function(node) {
            return json.elements.nodes.find(function(n) {
              return n.data.id === node.id();
            }).position;
          },
          zoom: json.zoom,
          pan: json.pan
        },

        style: style,
        minZoom: json.minZoom,
        maxZoom: json.maxZoom,
        wheelSensitivity: json.wheelSensitivity,
      });
    }

    cy.on('zoom', function(event) {
      graph.setFontSize(fontSize);
    });
    cy.panzoom();
    cy.cxtmenu(contextMenu);
    cy.cxtmenu(stationContextMenu);
    cy.cxtmenu(deliveryContextMenu);
    tracingService.init(cy);
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

  var style = cytoscape.stylesheet()
    .selector('node')
    .css({
      'content': 'data(name)',
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
    }).selector('node[?forward], node[?backward]')
    .css({
      'background-color': '#00FF00'
    }).selector('node:selected[?forward], node:selected[?backward]')
    .css({
      'background-color': '#008080'
    }).selector('edge[?forward], edge[?backward]')
    .css({
      'line-color': '#00FF00'
    });

  var contextMenu = {
    selector: 'core',
    commands: [{
      content: 'Apply Layout',
      select: function() {
        $mdDialog.show({
          controller: function($scope) {
            $scope.select = function(layout) {
              $mdDialog.hide(layout);
            };
          },
          template: `
            <md-dialog aria-label="Apply Layout">
              <md-toolbar><dialog-toolbar title="Apply Layout"></dialog-toolbar></md-toolbar>
              <md-dialog-content><layout-select on-select="select(layout)"></layout-select></md-dialog-content>
            </md-dialog>
          `,
          parent: angular.element(document.body),
          clickOutsideToClose: true
        }).then(function(layout) {
          cy.layout({
            name: layout,
            animate: true
          });
        });
      }
    }, {
      content: 'Zoom to Graph',
      select: function() {
        cy.fit();
      }
    }, {
      content: 'Clear Trace',
      select: function() {
        cy.batch(function() {
          tracingService.clearForwardTrace();
          tracingService.clearBackwardTrace();
        });
      }
    }]
  };

  var stationContextMenu = {
    selector: 'node',
    commands: [{
      content: 'Show Forward Trace',
      select: function(station) {
        cy.batch(function() {
          tracingService.clearForwardTrace();
          tracingService.clearBackwardTrace();
          tracingService.showStationForwardTrace(station);
        });
      }
    }, {
      content: 'Show Backward Trace',
      select: function(station) {
        cy.batch(function() {
          tracingService.clearForwardTrace();
          tracingService.clearBackwardTrace();
          tracingService.showStationBackwardTrace(station);
        });
      }
    }]
  };

  var deliveryContextMenu = {
    selector: 'edge',
    commands: [{
      content: 'Show Forward Trace',
      select: function(delivery) {
        cy.batch(function() {
          tracingService.clearForwardTrace();
          tracingService.clearBackwardTrace();
          tracingService.showDeliveryForwardTrace(delivery);
        });
      }
    }, {
      content: 'Show Backward Trace',
      select: function(delivery) {
        cy.batch(function() {
          tracingService.clearForwardTrace();
          tracingService.clearBackwardTrace();
          tracingService.showDeliveryBackwardTrace(delivery);
        });
      }
    }]
  };
});

'use strict';

/*global angular, cytoscape, $*/

angular.module('app').service('graph', function(tracing, $mdDialog) {

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
        }).selector('node[?forward], node[?backward]')
        .css({
          'background-color': '#00FF00'
        }).selector('node:selected[?forward], node:selected[?backward]')
        .css({
          'background-color': '#008080'
        }).selector('edge[?forward], edge[?backward]')
        .css({
          'line-color': '#00FF00'
        }),

      layout: {
        name: 'cose-bilkent'
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

        cy.batch(function() {
          addRelationsDataToDeliveries(data.deliveriesRelations);
        });
      }
    });

    cy.on('zoom', function(event) {
      graph.setFontSize(fontSize);
    });

    addGraphContextMenu(data);
    addStationContextMenu();
    addDeliveryContextMenu();
    tracing.init(cy);
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

  var addGraphContextMenu = function(data) {
    cy.cxtmenu({
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
            template: '<md-dialog aria-label="Apply Layout">' +
              '<md-toolbar><dialog-toolbar title="Apply Layout"></dialog-toolbar></md-toolbar>' +
              '<md-dialog-content><layout-select on-select="select(layout)"></layout-select></md-dialog-content>' +
              '</md-dialog>',
            parent: angular.element(document.body),
            clickOutsideToClose: true
          }).then(function(layout) {
            cy.layout({ name: layout, animate: true });
          });
        }
      }, {
        content: 'Show Data',
        select: function() {
          $mdDialog.show({
            controller: function($scope) {
              $scope.data = data;
            },
            template: '<md-dialog aria-label="Data">' +
              '<md-toolbar><dialog-toolbar title="Deliveries"></dialog-toolbar></md-toolbar>' +
              '<md-dialog-content><dialog-content elements="data.deliveries"></dialog-content></md-dialog-content>' +
              '</md-dialog>',
            parent: angular.element(document.body),
            clickOutsideToClose: true
          });
        }
      }]
    });
  };

  var addStationContextMenu = function() {
    cy.cxtmenu({
      selector: 'node',
      commands: [{
        content: 'Show Forward Trace',
        select: function(station) {
          cy.batch(function() {
            tracing.clearForwardTrace();
            tracing.clearBackwardTrace();
            tracing.showStationForwardTrace(station);
          });
        }
      }, {
        content: 'Show Backward Trace',
        select: function(station) {
          cy.batch(function() {
            tracing.clearForwardTrace();
            tracing.clearBackwardTrace();
            tracing.showStationBackwardTrace(station);
          });
        }
      }]
    });
  };

  var addDeliveryContextMenu = function() {
    cy.cxtmenu({
      selector: 'edge',
      commands: [{
        content: 'Show Forward Trace',
        select: function(delivery) {
          cy.batch(function() {
            tracing.clearForwardTrace();
            tracing.clearBackwardTrace();
            tracing.showDeliveryForwardTrace(delivery);
          });
        }
      }, {
        content: 'Show Backward Trace',
        select: function(delivery) {
          cy.batch(function() {
            tracing.clearForwardTrace();
            tracing.clearBackwardTrace();
            tracing.showDeliveryBackwardTrace(delivery);
          });
        }
      }]
    });
  };

  var addRelationsDataToDeliveries = function(relations) {
    cy.edges().data('from', []);
    cy.edges().data('to', []);

    for (var i = 0, j = relations.length; i < j; i++) {
      var from = relations[i].data.from;
      var to = relations[i].data.to;
      var fromDelivery = cy.$('#' + from);
      var toDelivery = cy.$('#' + to);

      fromDelivery.data('to', fromDelivery.data('to').concat(to));
      toDelivery.data('from', toDelivery.data('from').concat(from));
    }
  };

});
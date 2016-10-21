'use strict';

/*global angular, cytoscape, $*/

angular.module('app').service('graphService', function(tracingService, $mdDialog) {

  var graph = this;

  var cy;
  var graphData;
  var mergeDeliveries;
  var fontSize;

  graph.init = function(data) {
    graphData = data;

    if (cy === undefined) {
      cy = cytoscape({
        container: $('#graph')[0],

        elements: createElements(),

        layout: {
          name: 'random'
        },

        style: createStyle(),
        minZoom: 0.01,
        maxZoom: 10,
        wheelSensitivity: 0.5,
      });
    }
    else {
      var json = cy.json();

      cy = cytoscape({
        container: $('#graph')[0],

        elements: createElements(),

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

        style: createStyle(),
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
    tracingService.init(data);
  };

  graph.setMergeDeliveries = function(merge) {
    mergeDeliveries = merge;
    updateEdges();
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

  var repaint = function() {
    if (mergeDeliveries) {
      updateEdges();
      cy.nodes().data('update', true);
    }
    else {
      cy.elements().data('update', true);
    }
  };

  var updateEdges = function() {
    var edges = createElements().edges;

    for (let e of edges) {
      e.group = "edges";
    }

    cy.edges().remove();
    cy.add(edges);
  };

  var createElements = function() {
    if (mergeDeliveries) {
      var sourceTargetMap = new Map();

      for (let d of graphData.deliveries) {
        var key = d.data.source + '->' + d.data.target;
        var value = sourceTargetMap.get(key);

        sourceTargetMap.set(key, value !== undefined ? value.concat(d) : [d]);
      }

      var mergedDeliveries = [];

      for (let value of sourceTargetMap.values()) {
        var source = value[0].data.source;
        var target = value[0].data.target;

        mergedDeliveries.push({
          data: {
            id: source + '->' + target,
            source: source,
            target: target,
            backward: value.find(function(d) {
              return d.data.backward === true;
            }) !== undefined,
            forward: value.find(function(d) {
              return d.data.forward === true;
            }) !== undefined
          }
        });
      }

      return {
        nodes: graphData.stations,
        edges: mergedDeliveries
      };
    }
    else {
      return {
        nodes: graphData.stations,
        edges: graphData.deliveries
      };
    }
  };

  var createStyle = function() {
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
        'width': 12
      });

    var nodeProps = {
      'forward': [0, 255, 0],
      'backward': [0, 128, 128],
      'observed': [0, 0, 255],
      'outbreak': [255, 0, 0]
    };

    var edgeProps = {
      'forward': [0, 255, 0],
      'backward': [0, 128, 128],
      'observed': [0, 0, 255],
    };

    for (let combination of getAllCombination(Object.keys(nodeProps))) {
      var s = [];
      var c1 = [];
      var c2 = [];

      for (let prop of combination) {
        s.push('[?' + prop + ']');
        c1.push(nodeProps[prop]);
        c2.push(mix(nodeProps[prop], [0, 0, 255]));
      }

      style = style.selector('node' + s.join('')).css(createNodeBackground(c1));
      style = style.selector('node:selected' + s.join('')).css(createNodeBackground(c2));
    }

    for (let prop of Object.keys(edgeProps)) {
      style = style.selector('edge[?' + prop + ']').css(createEdgeColor(edgeProps[prop]));
    }

    return style;
  };

  var getAllCombination = function(values) {
    var n = Math.pow(2, values.length);
    var combinations = [];

    for (let i = 1; i < n; i++) {
      var bits = i.toString(2).split('').reverse().join('');
      var combination = [];

      for (let j = 0; j < values.length; j++) {
        if (bits[j] === '1') {
          combination.push(values[j]);
        }
      }

      combinations.push(combination);
    }

    combinations.sort(function(c1, c2) {
      return c1.length - c2.length;
    });

    return combinations;
  };

  var createNodeBackground = function(colors) {
    if (colors.length == 1) {
      return {
        'background-color': toRGB(colors[0])
      };
    }

    var css = {};

    for (var i = 0; i < colors.length; i++) {
      css['pie-' + (i + 1) + '-background-color'] = toRGB(colors[i]);
      css['pie-' + (i + 1) + '-background-size'] = 100 / colors.length;
    }

    return css;
  };

  var createEdgeColor = function(color) {
    return {
      'line-color': toRGB(color)
    };
  };

  var mix = function(color1, color2) {
    var r = Math.round((color1[0] + color2[0]) / 2);
    var g = Math.round((color1[1] + color2[1]) / 2);
    var b = Math.round((color1[2] + color2[2]) / 2);

    return [r, g, b];
  };

  var toRGB = function(color) {
    return 'rgb(' + color[0] + ', ' + color[1] + ', ' + color[2] + ')';
  };

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
          cy.layout(layout);
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
        tracingService.clearTrace();
        repaint();
      }
    }]
  };

  var stationContextMenu = {
    selector: 'node',
    commands: [{
      content: 'Show Forward Trace',
      select: function(station) {
        tracingService.clearTrace();
        tracingService.showStationForwardTrace(station.id());
        repaint();
      }
    }, {
      content: 'Show Backward Trace',
      select: function(station) {
        tracingService.clearTrace();
        tracingService.showStationBackwardTrace(station.id());
        repaint();
      }
    }, {
      content: 'Show Whole Trace',
      select: function(station) {
        tracingService.clearTrace();
        tracingService.showStationForwardTrace(station.id());
        tracingService.showStationBackwardTrace(station.id());
        repaint();
      }
    }, {
      content: 'Mark/Unmark as Outbreak',
      select: function(station) {
        tracingService.toggleOutbreakStation(station.id());
        repaint();
      }
    }]
  };

  var deliveryContextMenu = {
    selector: 'edge',
    commands: [{
      content: 'Show Forward Trace',
      select: function(delivery) {
        tracingService.clearTrace();
        tracingService.showDeliveryForwardTrace(delivery.id());
        repaint();
      }
    }, {
      content: 'Show Backward Trace',
      select: function(delivery) {
        tracingService.clearTrace();
        tracingService.showDeliveryBackwardTrace(delivery.id());
        repaint();
      }
    }, {
      content: 'Show Whole Trace',
      select: function(delivery) {
        tracingService.clearTrace();
        tracingService.showDeliveryForwardTrace(delivery.id());
        tracingService.showDeliveryBackwardTrace(delivery.id());
        repaint();
      }
    }]
  };
});

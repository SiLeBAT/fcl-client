'use strict';

/*global angular, cytoscape, $*/

angular.module('app').factory('graph', ['$q', function($q) {

  var cy;

  var graph = function(nodes, edges) {
    var deferred = $q.defer();
    var eles = [];
    var i;

    for (i = 0; i < nodes.length; i++) {
      eles.push({
        group: 'nodes',
        data: {
          id: nodes[i].id,
          weight: nodes[i].weight,
          name: nodes[i].name
        }
      });
    }

    for (i = 0; i < edges.length; i++) {
      eles.push({
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
          'height': 'mapData(weight, 1, 200, 1, 200)',
          'width': 'mapData(weight, 1, 200, 1, 200)',
          'text-valign': 'center',
          'color': 'white',
          'text-outline-width': 2,
          'text-outline-color': '#888'
        })
        .selector('edge')
        .css({
          'target-arrow-shape': 'triangle'
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

      elements: eles,

      ready: function() {
        deferred.resolve(this);
      }
    });

    return deferred.promise;
  };

  graph.setNodeWeight = function(id, weight) {
    cy.$('#' + id).data('weight', weight);
  };

  return graph;

}]);
'use strict';

/*global angular, cytoscape, $*/

angular.module('app').factory('peopleGraph', ['$q', function($q) {

  var cy;

  var peopleGraph = function(people) {
    var deferred = $q.defer();
    var eles = [];

    for (var i = 0; i < people.length; i++) {
      eles.push({
        group: 'nodes',
        data: {
          id: people[i].id,
          weight: people[i].weight,
          name: people[i].name
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

  peopleGraph.setPersonWeight = function(id, weight) {
    cy.$('#' + id).data('weight', weight);
  };

  return peopleGraph;

}]);
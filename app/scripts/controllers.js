'use strict';

/*global angular*/

angular.module('app').controller('GraphCtrl', ['$scope', 'dataProvider', 'graph', function($scope, dataProvider, graph) {

  $scope.nodes = dataProvider.getNodes();
  $scope.edges = dataProvider.getEdges();

  graph($scope.nodes, $scope.edges).then(function(peopleCy) {
    $scope.cyLoaded = true;
  });

  $scope.onWeightChange = function(node) {
    graph.setNodeWeight(node.id, node.weight);
  };

}]);
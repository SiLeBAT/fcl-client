'use strict';

/*global angular*/

angular.module('app').controller('GraphCtrl', ['$scope', 'dataProvider', 'graph', function($scope, dataProvider, graph) {

  graph(dataProvider.getNodes(), dataProvider.getEdges()).then(function(cy) {
    $scope.cyLoaded = true;
  });
  
  $scope.nodeSize = 50;
  $scope.sizes = [{value: 50, label: "Small"}, {value: 100, label: "Large"}];

  $scope.onNodeSizeChange = function() {
    graph.setNodeSize($scope.nodeSize);
  };

}]);
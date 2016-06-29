'use strict';

/*global angular*/

angular.module('app').controller('GraphController', function($scope, dataProvider, graph) {
  
  $scope.nodeSize = 50;
  $scope.sizes = {
    Small: 50,
    Large: 100
  };

  graph.init(dataProvider.getNodes(), dataProvider.getEdges());

  $scope.onNodeSizeChange = function() {
    graph.setNodeSize($scope.nodeSize);
  };

});
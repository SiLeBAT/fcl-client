'use strict';

/*global angular*/

angular.module('app').controller('GraphController', function($scope, dataProvider, graph) {
  
  $scope.nodeSize = 50;

  graph.init(dataProvider.getNodes(), dataProvider.getEdges());

  $scope.onNodeSizeChange = function(size) {
    $scope.nodeSize = size;
    graph.setNodeSize(size);
  };

});
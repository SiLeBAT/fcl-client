'use strict';

/*global angular*/

angular.module('app').controller('GraphCtrl', function($scope, $mdSidenav, dataProvider, graph) {
  
  $scope.nodeSize = 50;
  $scope.sizes = {
    Small: 50,
    Large: 100
  };

  graph(dataProvider.getNodes(), dataProvider.getEdges());

  $scope.onNodeSizeChange = function() {
    graph.setNodeSize($scope.nodeSize);
  };

  $scope.toogleList = function() {
    $mdSidenav('sidenav').toggle();
  };

});
'use strict';

/*global angular*/

angular.module('app').controller('ToolbarController', function($scope, $mdSidenav) {

  $scope.toogleList = function() {
    $mdSidenav('sidenav').toggle();
  };

});
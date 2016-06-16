'use strict';

/*global angular*/

angular.module('app').controller('PeopleCtrl', [ '$scope', 'peopleGraph', function( $scope, peopleGraph ){
  var cy; // maybe you want a ref to cy
  // (usually better to have the srv as intermediary)
  
  $scope.people = [
    { id: 'l', name: 'Laurel', weight: 65 },
    { id: 'h', name: 'Hardy', weight: 110 }
  ];
  
  var peopleById = {};
  for( var i = 0; i < $scope.people.length; i++ ){
    var p = $scope.people[i];
    
    peopleById[ p.id ] = p;
  }
  
  // you would probably want some ui to prevent use of PeopleCtrl until cy is loaded
  peopleGraph( $scope.people ).then(function( peopleCy ){
    cy = peopleCy;
    
    // use this variable to hide ui until cy loaded if you want
    $scope.cyLoaded = true;
  });
  
  $scope.onWeightChange = function(person){
     peopleGraph.setPersonWeight( person.id, person.weight );
  };
  
  peopleGraph.onWeightChange(function(id, weight){
    peopleById[id].weight = weight;
    
    $scope.$apply();
  });
 
}]);
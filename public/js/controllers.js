'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
  controller('SeasonsCtrl', function ($scope, response) {
    $scope.data = response.data;
  }).
  controller('SeasonCtrl', function ($scope, $stateParams, response) {
    $scope.id = $stateParams.id;
    $scope.data = response.data;
  });

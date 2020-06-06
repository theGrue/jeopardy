'use strict';

angular.module('myApp.controllers').
  controller('FinalCtrl', function ($scope, $modal, response, socket) {
    $scope.data = response.data;

    socket.emit('game:init', $scope.data.id);
    socket.on('game:init', function (data) {
      console.log('game:init ' + !!data);
      if (data) {
        $scope.game = data.game;
      }
    })

    $scope.submitWager = function (name, wager) {
      socket.emit('final_wager:submit', {
        id: $scope.data.id,
        wager: {
          name: name,
          wager_amount: wager
        }
      })
    };

    $scope.submitFinal = function (name, wager, answer) {
      socket.emit('final:submit', {
        id: $scope.data.id,
        answer: {
          'name': name,
          'wager': wager,
          'answer': answer
        }
      });
    };
  });

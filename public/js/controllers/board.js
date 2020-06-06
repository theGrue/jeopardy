'use strict';

angular.module('myApp.controllers').
  controller('BoardCtrl', function ($scope, $timeout, $modal, socket, currencyFilter) {
    socket.emit('board:init');

    socket.on('board:init', function (data) {
      console.log('board:init ' + !!data);
      if (data) {
        $scope.data = data.data;
        $scope.game = data.game;
        $scope.scoreHtml = buildScores();
      }
    })

    function buildPlayerScore(player) {
      var playerScore = ""
      if (player.name) {
        playerScore = '<div class="col-md-4 text-center player-total">' +
          '<div class="player-name">' + player.name +
          '</div><div class="player-score">' +
          currencyFilter(($scope.game.player_1 && $scope.game.player_1.score) || 0, '$', 0) +
          '</div>' +
          '</div>'
      }
      return playerScore
    }

    function buildScores() {
      var output = '<div class="row" hello>'
      output = output.concat(buildPlayerScore($scope.game.player_1))
      output = output.concat(buildPlayerScore($scope.game.player_2))
      output = output.concat(buildPlayerScore($scope.game.player_3))
      output = output.concat(buildPlayerScore($scope.game.player_4))
      output = output.concat(buildPlayerScore($scope.game.player_5))
      output = output.concat(buildPlayerScore($scope.game.player_6))
      output = output.concat('</div>')
      return output
    }

    socket.on('round:start', function (data) {
      console.log('round:start');
      if (modalInstance) {
        modalInstance.close();
      }

      $scope.data = data.data;
      $scope.game = data.game;

      if (data.game.round === 'DJ') {
        openModal();
        $timeout(modalInstance.close, 5000);
      }
      else if (data.game.round === 'FJ') {
        $scope.scoreHtml = buildScores();
      }
      else if (data.game.round === 'end') {
        openModal();
      }
    });

    var modalInstance;
    function openModal(id) {
      if (modalInstance) {
        modalInstance.close();
      }

      modalInstance = $modal.open({
        templateUrl: 'partials/boardclue',
        controller: 'BoardClueCtrl',
        backdrop: 'static',
        size: 'lg',
        openedClass: 'board-modal-open',
        resolve: {
          response: function () {
            return {
              id: id,
              clue: $scope.data[id],
              game: $scope.game,
              scoreHtml: buildScores()
            };
          }
        }
      });
    };

    socket.on('clue:start', function (data) {
      console.log('clue:start ' + data);
      openModal(data);
    });

    socket.on('clue:end', function (data) {
      console.log('clue:end');
      $scope.game = data;
      if (modalInstance) {
        modalInstance.close();
      }
    });
  });

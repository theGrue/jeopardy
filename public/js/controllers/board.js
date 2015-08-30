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

    function buildScores () {
      return '<div class="row">' +
          '<div class="col-md-4 text-center">' +
            '<div class="player-name">' +
              (($scope.game.player_1 && $scope.game.player_1.name) || 'Player 1') +
            '</div><div class="player-score">' +
              currencyFilter(($scope.game.player_1 && $scope.game.player_1.score) || 0, '$', 0) +
            '</div>' +
          '</div>' +
          '<div class="col-md-4 text-center">' +
            '<div class="player-name">' +
              (($scope.game.player_2 && $scope.game.player_2.name) || 'Player 2') +
            '</div><div class="player-score">' +
              currencyFilter(($scope.game.player_2 && $scope.game.player_2.score) || 0, '$', 0) +
            '</div>' +
          '</div>' +
          '<div class="col-md-4 text-center">' +
            '<div class="player-name">' +
              (($scope.game.player_3 && $scope.game.player_3.name) || 'Player 3') +
            '</div><div class="player-score">' +
              currencyFilter(($scope.game.player_3 && $scope.game.player_3.score) || 0, '$', 0) +
            '</div>' +
          '</div>' +
        '</div>';
    }

    socket.on('round:start', function (data) {
      console.log('round:start');
      if (modalInstance) {
        modalInstance.close();
      }

      $scope.data = data.data;
      $scope.game = data.game;

      if (data.game.round === 'DJ') {
        openModal(buildScores());
        $timeout(modalInstance.close, 5000);
      }
      else if (data.game.round === 'FJ') {
        $scope.scoreHtml = buildScores();
      }
      else if (data.game.round === 'end') {
        openModal(buildScores());
      }
    });

    var modalInstance;
    function openModal (message) {
      if (modalInstance) {
        modalInstance.close();
      }

      modalInstance = $modal.open({
        template: '<div class="modal-body"><div>' + message + '</div></div>',
        scope: $scope,
        backdrop: 'static',
        keyboard: false,
        size: 'lg',
        openedClass: 'board-modal-open'
      });
    };

    socket.on('clue:start', function (data) {
      console.log('clue:start ' + data);
      if (!$scope.data[data].daily_double) {
        if (data === 'clue_FJ') {
          openModal($scope.data[data].clue_html + '<iframe width="420" height="0" src="https://www.youtube.com/embed/1Obmnz_1hZk?autoplay=1&autohide=0&rel=0" frameborder="0" allowfullscreen style="display:none"></iframe>');
        }
        else {
          openModal($scope.data[data].clue_html);
        }
      }
      else {
        openModal('Daily<br />Double<br /><br />' +
          buildScores() +
          '<iframe width="420" height="0" src="https://www.youtube.com/embed/_HRJGNPg8MY?autoplay=1&autohide=0&rel=0" frameborder="0" allowfullscreen style="display:none"></iframe>');
      }
    });

    socket.on('clue:daily', function (data) {
      console.log('clue:daily ' + data);
      openModal($scope.data[data].clue_html);
    });

    socket.on('clue:end', function (data) {
      console.log('clue:end');
      $scope.game = data;
      if (modalInstance) {
        modalInstance.close();
      }
    });
  });

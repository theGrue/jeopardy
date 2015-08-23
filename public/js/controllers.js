'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
  controller('AppCtrl', function ($scope, socket) {
    socket.on('send:name', function (data) {
      $scope.name = data.name;
    });
  }).
  controller('MyCtrl1', function ($scope, socket) {
    socket.on('send:time', function (data) {
      $scope.time = data.time;
    });
  }).
  controller('MyCtrl2', function ($scope) {
    // write Ctrl here
  }).
  controller('SeasonsCtrl', function ($scope, response) {
    $scope.data = response.data;
  }).
  controller('SeasonCtrl', function ($scope, $stateParams, response) {
    $scope.id = $stateParams.id;
    $scope.data = response.data;
  }).
  controller('GameCtrl', function ($scope, $modal, response, socket) {
    $scope.data = response.data;
    $scope.game = {};

    socket.emit('game:init', $scope.data.id);

    socket.on('game:init', function (data) {
      console.log('game:init ' + !!data);
      if (data) {
        $scope.game = data.game;
      }
    })

    socket.on('round:start', function (data) {
      console.log('round:start');
      $scope.game = data.game;
    });

    $scope.startGame = function () {
      console.log('game:start emit');
      socket.emit('game:start', {
        data: $scope.data,
        game: $scope.game
      }, function (result) {
        console.log('callback');
      });
    };

    $scope.startClue = function (id) {
      console.log('clue:start emit ' + id);
      socket.emit('clue:start', id);
      var modalInstance = $modal.open({
        templateUrl: 'partials/clue',
        controller: 'ClueCtrl',
        backdrop: 'static',
        keyboard: false,
        size: 'lg',
        openedClass: 'game-modal-open',
        resolve: {
          response: function () {
            var split = id.split('_').slice(0, 3);
            split[0] = 'category';

            if (split.length === 2) {
              split.push(1);
            }

            return {
              id: id,
              category: $scope.data[split.join('_')],
              clue: $scope.data[id],
              game: $scope.game
            };
          }
        }
      });

      modalInstance.result.then(function (result) {
        angular.extend($scope.game, result);

        // Keep score.
        result = result[id];
        [1, 2, 3].forEach(function (num) {
          var key = 'player_' + num
          $scope.game[key] = $scope.game[key] || {};
          $scope.game[key].score = $scope.game[key].score || 0;

          var value = id === 'clue_FJ' ? parseInt($scope.game[key].fj_wager) : result.value;

          if (result[key] && result[key].right) {
            $scope.game[key].score += value;
          }
          else if (result[key] && result[key].wrong) {
            $scope.game[key].score -= value;
          }
        });

        console.log('clue:end emit');
        socket.emit('clue:end', $scope.game);
      });
    };

    $scope.endRound = function () {
      console.log('round:end emit');
      socket.emit('round:end', $scope.game);
    };

    $scope.resetGame = function () {
      $scope.game = {};
    }
  }).
  controller('ClueCtrl', function ($scope, $modalInstance, response, socket) {
    $scope.category = response.category;
    $scope.clue = response.clue;
    $scope.game = response.game;
    $scope.result = {
      player_1: {},
      player_2: {},
      player_3: {},
      dd_player: 'player_1'
    };

    var value = response.id.split('_');
    $scope.result.value = $scope.result.dd_value = parseInt(value[3]) * (value[1] === 'J' ? 200 : 400);

    $scope.setResult = function (num, correct) {
      var key = 'player_' + num;
      $scope.result[key][correct ? 'right' : 'wrong'] = !$scope.result[key][correct ? 'right' : 'wrong'];
      $scope.result[key][correct ? 'wrong' : 'right'] = undefined;

      if ($scope.result[key].right && response.id !== 'clue_FJ') {
        if (num === 1) {
          $scope.result.player_2.right = undefined;
          $scope.result.player_3.right = undefined;
        }
        else if (num === 2) {
          $scope.result.player_1.right = undefined;
          $scope.result.player_3.right = undefined;
        }
        else if (num === 3) {
          $scope.result.player_1.right = undefined;
          $scope.result.player_2.right = undefined;
        }
      }
    };

    $scope.setDDValue = function () {
      $scope.result.value = parseInt($scope.result.dd_value);
      $scope.result.dd_confirm = true;
      console.log('clue:daily emit');
      socket.emit('clue:daily', response.id);
    };

    $scope.setDDResult = function (correct) {
      console.log('setDDResult ' + correct);
      $scope.result.dd_result = correct;
    };

    $scope.ok = function () {
      var result = {};
      if ($scope.clue.daily_double) {
        $scope.result[$scope.result.dd_player] = $scope.result[$scope.result.dd_player] || {};
        $scope.result[$scope.result.dd_player][$scope.result.dd_result ? 'right' : 'wrong'] = true;
      }
      result[response.id] = $scope.result;
      $modalInstance.close(result);
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  }).
  controller('BoardCtrl', function ($scope, $modal, socket) {
    socket.emit('board:init');

    socket.on('board:init', function (data) {
      console.log('board:init ' + !!data);
      if (data) {
        $scope.data = data.data;
        $scope.game = data.game;
      }
    })

    socket.on('round:start', function (data) {
      console.log('round:start');
      if (modalInstance) {
        modalInstance.close();
      }

      $scope.data = data.data;
      $scope.game = data.game;
    });

    var modalInstance;
    function openModal (message) {
      if (modalInstance) {
        modalInstance.close();
      }

      modalInstance = $modal.open({
        template: '<div class="modal-body">' + message + '</div>',
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
          openModal($scope.data[data].clue_html + '<iframe width="420" height="24" src="https://www.youtube.com/embed/1Obmnz_1hZk?autoplay=1&autohide=0&rel=0" frameborder="0" allowfullscreen></iframe>');
        }
        else {
          openModal($scope.data[data].clue_html);
        }
      }
      else {
        openModal('Daily<br />Double<br /><iframe width="420" height="24" src="https://www.youtube.com/embed/_HRJGNPg8MY?autoplay=1&autohide=0&rel=0" frameborder="0" allowfullscreen></iframe>');
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
    })
  });

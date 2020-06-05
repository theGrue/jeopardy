/*
 * Serve content over a socket
 */

var _ = require('lodash');
var jsonfile = require('jsonfile');
var id, datas = {};

module.exports = function (io) {
  return function (socket) {
    socket.on('game:start', function (data) {
      console.log('game:start ' + data.data.id);
      id = data.data.id;
      datas[id] = data;
      data.game.round = 'J';
      io.emit('round:start', data);
    });

    socket.on('final_wager:submit', function (data) {
      console.log('final_wager:submit ' + data.id + data.wager.name, data.wager.wager_amount);
      datas[id].game.final_wagers.push(data.wager);
    });

    socket.on('final:submit', function (data) {
      console.log('final:submit ' + data.id + data.answer);
      datas[id].game.final_answers.push(data.answer);
      console.log(datas[id].game.final_answers);
      io.emit('final:submit:done', datas[id].game.final_answers)
    });

    socket.on('round:end', function (data) {
      console.log('round:end ' + data.round);
      if (data.round === 'J') {
        data.round = 'DJ';
        if (data.player_1.score < data.player_2.score && data.player_1.score < data.player_3.score) {
          data.control_player = 'player_1';
        }
        else if (data.player_2.score < data.player_1.score && data.player_2.score < data.player_3.score) {
          data.control_player = 'player_2';
        }
        else if (data.player_3.score < data.player_1.score && data.player_3.score < data.player_2.score) {
          data.control_player = 'player_3';
        }
      }
      else if (data.round === 'DJ') {
        data.round = 'FJ';
        data.control_player = undefined;
      }
      else if (data.round === 'FJ') {
        data.round = 'end';

        var file = 'games/' + id + '-' + new Date().getTime() + '.json';
        jsonfile.writeFileSync(file, data, { spaces: 2 });
      }
      datas[id].game = data;
      io.emit('round:start', datas[id]);
    })

    socket.on('board:init', function () {
      console.log('board:init');
      socket.emit('board:init', datas[id]);
    });

    socket.on('game:init', function (data) {
      console.log('game:init ' + data);
      socket.emit('game:init', datas[data]);
    });

    socket.on('clue:start', function (data) {
      console.log('clue:start ' + data);
      socket.broadcast.emit('clue:start', data);
    });

    socket.on('clue:daily', function (data) {
      console.log('clue:daily');
      socket.broadcast.emit('clue:daily', data);
    });

    socket.on('clue:end', function (data) {
      console.log('clue:end');
      datas[id].game = data;
      socket.broadcast.emit('clue:end', data);
    });
  };
};

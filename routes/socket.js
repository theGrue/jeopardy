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

    socket.on('round:end', function (data) {
      console.log('round:end ' + data.round);
      if (data.round === 'J') {
        data.round = 'DJ';
      }
      else if (data.round === 'DJ') {
        data.round = 'FJ';
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

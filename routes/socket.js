/*
 * Serve content over a socket
 */

var _ = require('lodash');
var id, datas = {};

module.exports = function (io) {
  return function (socket) {
    socket.emit('send:name', {
      name: 'Bob'
    });

    // setInterval(function () {
    //   socket.emit('send:time', {
    //     time: (new Date()).toString()
    //   });
    // }, 1000);

    socket.on('game:start', function (data) {
      console.log('game:start ' + data.data.id);
      id = data.data.id;
      datas[id] = data;
      data.game.round = 'J';
      io.emit('round:start', data);
    });

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

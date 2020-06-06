var socket = io.connect();

socket.on('final_wager:submit:done', function (data) {
  $('#final-wagers').append(data.name + " $" + data.wager_amount + "</br>")
});

socket.on('final:submit:done', function (data) {
  $('#final-answers').append(data.name + " $" + data.wager + " -  " + data.answer + "</br>")
});

function wager() {
  $('#final-wager').hide();
  $('#final-answer').show();
}

function answer() {
  $('#final-answer').hide();
  $('#final-thank-you').show();
}

function resetFinal() {
  $('#final-wager').show();
  $('#final-answer').hide();
  $('#final-thank-you').hide();
}
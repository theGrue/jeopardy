console.log('You are awesome');
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
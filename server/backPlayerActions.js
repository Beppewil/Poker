const _handComparison = require('./handComparison.js')
//const _bscript = require('./script.js')

var gameEnded;
var folded;

function _gameEnd() {
    if (!gameEnded) {
      gameEnded = true;
      /*document.getElementById("player2Card1").classList.add("rotate90Y");
      document.getElementById("player2Card2").classList.add("rotate90Y");
      script.HTMLCardDisplay(script.player2, "player2Card");*/
      /*setTimeout(() => {
        document.getElementById("player2Card1").classList.remove("rotate90Y");
        document.getElementById("player2Card2").classList.remove("rotate90Y");
      }, 500)*/
      if (folded) {
        console.log("Player 2 wins");
        alert("player 2 wins")
        players.splice(0,1);
      }
      else {
        player1Hand = _bscript.player1.concat(comCards);
        player2Hand = _bscript.player2.concat(comCards);
        console.log(_handComparison.arrayhandComparison([player1Hand, player2Hand]));
        alert(_handComparison.arrayhandComparison([player1Hand, player2Hand]))
      }
    }
}

module.exports = {_gameEnd}
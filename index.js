const _backPlayerActions = require("./server/backPlayerActions.js");
const _handComparison = require("./server/handComparison.js");
const _handEvaluation = require("./server/handEvaluation.js");
const _cards = require("./server/cards.js");

const express = require("express");
const app = express();
const port = 3000;

// socket.io setup
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static("public"));

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/public/index.html");
});

var playerNumbers = [1, 2, 3, 4, 5, 6, 7, 8];

const players = {};

var allBetted = true;
var playerTurn = [];
var i = 0;
var comparisonArray = [];
var currentBet = 0;
var foldedPlayers = [];
var gameStarted = false;
var playerCards = [];
var pot = 0;
var gameNum = 0;
var blindValue = 25;
var everyonePlaying = true;

var deck = [];
_cards.deckCreate(deck);
_cards.shuffle(deck);

var comCards = [];
/*
 */

io.on("connection", (socket) => {
  //Joining and leaving
  console.log("a user connected");
  players[socket.id] = {
    socket: socket,
    username: null,
    playerNum: playerNumbers.shift(),
    money: 1000,
    maxWin: 0,
    bet: 0,
    betted: false,
    roundBet: 0,
    folded: false,
    playing: null,
    hand: [],
  };
  
  if (!gameStarted) {socket.emit('optChoices', 'cards');}

  socket.emit('playerJoin', '')
  socket.on('usernameEntered', (username) => {
    if (Object.keys(players).filter(key => players[key].username == username).length == 0) {
      players[socket.id].username = username;
    } else (socket.emit('playerJoin', 'Sorry Username Is Taken '))
  })
  
  socket.on('optIN', (vote) => {
    if (!gameStarted) {
      everyonePlaying = true
      if (vote == true) {
        players[socket.id].playing = true;
      }
      else {
        players[socket.id].playing = false;
      }
      for (let player in players) {
        if (players[player].playing == null) {
          console.log(players)
          everyonePlaying = false;
        }
      }

      if (/*everyonePlaying &&*/  Object.keys(players).filter(key => players[key].playing == true).length >= 2 ) {
        console.log("NEW ROUND")
        newRound()
      }
    }
  })

  socket.on("disconnect", (reason) => {
    console.log(`${socket.id} disconnected (${reason})`);
    playerNumbers.unshift(players[socket.id].playerNum);
    playerNumbers.sort((a, b) => a - b);
    const index = playerTurn.indexOf(players[socket.id].playerNum);
    if (index < i) {
      i--;
    } //if the player who leaves was before the current move i back so that player doesnt lose their turn
    if (index > -1) {
      // only splice array when item is found
      playerTurn.splice(index, 1); // 2nd parameter means remove one item only
    }
    if (i > playerTurn.length - 1) {
      i = 0;
    }
    delete players[socket.id];
    io.emit("playerDisconnect", socket.id);

    if (playerTurn.length < 2) {
      for (let player in players) {
        players[player].playing = null;
      }
      gameStarted = false;
    }
  });

  //Chat
  socket.on("chat message", (msg) => {
    io.emit("chat message", [players[socket.id].username, msg]);
    console.log(msg);
  });

  socket.emit("dealCards", players[socket.id].hand);

  //Player Betting
  socket.on("playerBet", (betType) => {
    if (
      players[socket.id].playerNum == playerTurn[i] && players[socket.id].folded == false && gameStarted == true
    ) {
      if (comCards.length <= 5) {
        allBetted = true;
        if (betType[1] != null) {
          players[socket.id].bet = betType[1];
        }

        if (players[socket.id].roundBet < currentBet) {
          players[socket.id].bet = currentBet - players[socket.id].roundBet;
        }

        if (players[socket.id].money >= players[socket.id].bet) {
          if (betType[0] == "call") {
            console.log("Call");
            players[socket.id].betted = true;
            players[socket.id].money -= players[socket.id].bet;
            players[socket.id].roundBet += players[socket.id].bet;
            pot += players[socket.id].bet;
            players[socket.id].bet = 0;
            socket.emit("updateMoney", players[socket.id].money);
          } else if (betType[0] == "raise") {
              console.log("raise");
              players[socket.id].betted = true;
              players[socket.id].money -= players[socket.id].bet;
              players[socket.id].roundBet += players[socket.id].bet;
              currentBet += players[socket.id].bet;
              pot += players[socket.id].bet;
              players[socket.id].bet = 0;
              socket.emit("updateMoney", players[socket.id].money);
              for (let player in players) {
                if (player != socket.id && players[player].folded == false) {
                  players[player].betted = false;
                }
              io.emit("updateBet", [players[player].betted, currentBet]);
              }
          } else {
            console.log("Fold");
            foldedPlayers.push(...playerTurn.splice(playerTurn.indexOf(players[socket.id].playerNum),1));
            i--;
            _backPlayerActions.folded = true;
            players[socket.id].hand = [];
            players[socket.id].folded = true;
            players[socket.id].bet = 0;
          }

          if (i < playerTurn.length - 1) {
            i++;
          } else {
            i = 0;
          }

          updateArrow(i);
        } else {
          if (betType[0] == "raise") {
            socket.emit("notEnoughMoney", players[socket.id].money);
          } else {
            players[socket.id].betted = true;
          }
        }
        //if all players have betted play next card
        for (let player in players) {
          if (
            players[player].betted == false &&
            players[player].folded == false &&
            players[player].playing == true
          ) {
            allBetted = false;
          }
        }
        if (allBetted) {
          currentBet = 0;
          i = 0;
          _allBetted();
          for (let player in players) {
            players[player].betted = false;
            players[player].roundBet = 0;
          }
          console.log("ALL BETTED");
        }
      }
    }
  });
});

server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

function _allBetted() {
  if (comCards.length < 3) {
    comCards = deck.splice(0, 3);
    io.emit("nextCards", comCards);
  } else if (comCards.length < 5) {
    var newCard = deck.splice(0, 1)[0];
    comCards.push(newCard);
    io.emit("nextCards", comCards);
  } else {
    for (let player in players) {
      var tempCards = [];
      tempCards.push(...playerCards);
      tempCards.splice(tempCards.indexOf(players[player].hand), 1);
      players[player].socket.emit("showCards", tempCards);
    }
    for (let player in players) {
      console.log(players[player].playing)
      if (players[player].folded == false && players[player].playing == true) {
        for (let card in comCards) {
          players[player].hand.push(comCards[card]);
        }
        comparisonArray.push([players[player].hand, players[player].playerNum]);
        players[player].playing = null;
      } else {
        for (let card in comCards) {
          players[player].hand.push(comCards[card]);
        }
      }
    }
    if (comparisonArray.length > 1) {
      var winner = _handComparison.arrayHandComparison(comparisonArray);
      console.log(winner)
    } else {
      for (let player in players) {
        if (players[player].folded == false) {
          var winner = [players[player].playerNum];
        }
      }
    }
    for (let player in players) {
      players[player].socket.emit("roundOver", [
        winner,
        players[player].playerNum,
        _handEvaluation.handEvaluation(players[player].hand)[1],
      ]);
      if (winner.includes(players[player].playerNum)) {
        players[player].money += Math.floor(pot / winner.length);
      }
      players[player].socket.emit("updateMoney", players[player].money);
      players[player].playing = null;
    }
    io.emit('optChoices', 'balls')
    gameStarted = false;
  }
}

function newRound() {
  startGame();
  gameNum += 1;
  i = 0;
  pot = 0;
  foldedPlayers = [];
  playerTurn = [];
  comparisonArray = [];
  playerCards = [];
  for (let player in players) {
    if (players[player].playing == true) {
      playerTurn.push(players[player].playerNum);
      players[player].playing = true;
    }
  }
  playerTurn.sort((a, b) => a - b);
  for (let e = 0; e < gameNum; e++) {
    playerTurn.push(playerTurn.shift());
  }
  gameStarted = true;
  for (let player in players) {
    if (players[player].playing == true) {
      players[player].hand = [];
      players[player].betted = false;
      players[player].folded = false;
      players[player].maxWin = players[player].money;
      if (
        players[player].playerNum == playerTurn[0] ||
        players[player].playerNum == playerTurn[1]
      ) {
        players[player].money -=
          blindValue * (playerTurn.indexOf(players[player].playerNum) + 1);
        if (i < playerTurn.length - 1) {
          i++;
        } else {
          i = 0;
        }
        players[player].roundBet = blindValue * (playerTurn.indexOf(players[player].playerNum) + 1);
        pot += blindValue * (playerTurn.indexOf(players[player].playerNum) + 1);
        players[player].socket.emit("updateMoney", players[player].money);
      }
      players[player].bet = 0;
      players[player].hand.push(...deck.splice(0, 2));
      players[player].socket.emit("dealCards", players[player].hand);
      playerCards.push(players[player].hand);
    }
  }
  currentBet = blindValue * 2;
  if (playerTurn.length == 2) {updateArrow(0)} else {updateArrow(2);}
  io.emit("newRound");
  io.emit("updateBet", ['', 50])
}

function startGame() {
  deck = [];
  _cards.deckCreate(deck);
  _cards.shuffle(deck);
  comCards = [];
}

function updateArrow(i) {
  //console.log(`Updating arrow for turn ${i}`);  Commented log where used for trouble shooting an issue where the arrow wasnt moving
  //console.log(`playerTurn[${i}]: ${playerTurn[i]}`);
  for (let player in players) {
    //console.log(`Processing player ${player}`);
    if (players[player].playerNum == playerTurn[i]) {
      //console.log(`T Emitting moveArrow event to player ${player} with value 1`);
      players[player].socket.emit("moveArrow", 1);
    } else if (players[player].playerNum != playerTurn[0]) {
      if (i + 2 <= playerTurn.length) {
        //console.log(`Emitting moveArrow event to player ${player} with value ${i+2}`);
        players[player].socket.emit("moveArrow", i + 2);
      } else {
        //console.log(`Emitting moveArrow event to player ${player} with value 2`);
        players[player].socket.emit("moveArrow", 2);
      }
    } else {
      //console.log(` E Emitting moveArrow event to player ${player} with value ${playerTurn[i]}`);
      players[player].socket.emit("moveArrow", i + 1);
    }
  }
}

//Troubleshoot
//Add 10 second timer before round auto start once 2 players have joined
//Add a way to see if all players have betted 
//Keep play next round button to stay until round start
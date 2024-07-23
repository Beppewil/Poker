const _backPlayerActions = require("./server/backPlayerActions.js");
const _handComparison = require("./server/handComparison.js");
const _handEvaluation = require("./server/handEvaluation.js");
const _cards = require("./server/cards.js");

const profanity = require('@2toad/profanity').profanity;

const express = require("express");
const app = express();
const port = 25565;


// socket.io setup
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const { v4: uuidV4} = require('uuid');

app.set('view engine', 'ejs');

app.use(express.static("views"));

app.get("/", function (req, res) {
  //res.sendFile(__dirname + "/public/balls.html")
  res.redirect(`/${uuidV4()}`)
  //res.redirect("/balls")
});

app.get("/:room", function (req, res) {
  res.render("index", {room: req.params.room});
  //res.sendFile(__dirname + "/public/index.html")
})




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
var playerList = [];

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

  playerList.push({p:players[socket.id].playerNum, n: 'user not entered'})
  io.emit('updatePlayerList', playerList)
  
  if (!gameStarted) {socket.emit('optChoices', 'cards');}

  socket.emit('playerJoin', '');
  socket.on('usernameEntered', (username) => {
    if (Object.keys(players).filter(key => players[key].username == username).length == 0 && !profanity.exists(username)) {
      players[socket.id].username = username;
      playerList[playerList.findIndex(obj => obj.p == players[socket.id].playerNum)].n = username;
      io.emit('updatePlayerList', playerList)
    } else (socket.emit('playerJoin', 'Sorry Username Is Taken or Contains Profanity '))
  })

 
  socket.on('playerKick', (player) => {
    var kicked = false;
    if (players[socket.id].playerNum == 1) {
      for (let p in players) {
        if(players[p].playerNum == player && kicked == false) {
          players[p].socket.disconnect();
          kicked = true;
        }
      }
    }
  })

  
  socket.on('optIN', (vote) => {
    if (!gameStarted) {
      if (vote == true && players[socket.id].money >= blindValue * 2) {
        players[socket.id].playing = true;
      }
      else {
        players[socket.id].playing = false;
      }
      checkOpted();
    }
  })

  socket.on("disconnect", (reason) => {
    console.log(`${socket.id} disconnected (${reason})`);
    const index = playerTurn.indexOf(players[socket.id].playerNum);
    if (index < i) {
      i--;

    } //if the player who leaves was before the current move i back so that player doesnt lose their turn
    if (index > -1) {
      // only splice array when item is found
      playerTurn.splice(index, 1); 
    }
    if (i > playerTurn.length - 1) {
      i = 0;
    }

    playerNumbers.push(playerList[playerList.length - 1].p);
     
    for (let player in players) {
      if (players[socket.id].playerNum < players[player].playerNum) {
        playerList[playerList.findIndex(obj => obj.p == players[player].playerNum)].p = players[player].playerNum - 1;
        players[player].playerNum -= 1
      }
    }
    
    playerNumbers.sort((a, b) => a - b);

    playerList.splice(playerList.findIndex(obj => obj.p == players[socket.id].playerNum), 1);
    playerTurn = playerTurn.map(e => e - 1);
    delete players[socket.id];
    io.emit('updatePlayerList', playerList)
    io.emit("playerDisconnect", socket.id);
    checkOpted();
    
    

    if (playerTurn.length <= 1 && gameStarted) {
      gameStarted = false;
      for (let player in players) {
        players[player].playing = null;
        if (players[player].playing = true) {if (players[player].maxWin < pot) {players[player].money += players[player].maxWin} else {players[player].money += pot} players[player].socket.emit('updateMoney', players[player].money) }
        
      }
      io.emit('optChoices', '<2');
      console.log("New game")
    }
  });

  //Chat
  socket.on("chat message", (msg) => {
    io.emit("chat message", [players[socket.id].username, profanity.censor(msg)]);
  });

  socket.emit("dealCards", players[socket.id].hand);

  //Player Betting
  socket.on("playerBet", (betType) => {
    if (
      players[socket.id].playerNum == playerTurn[i] && players[socket.id].folded == false && gameStarted == true
    ) {
      if (comCards.length <= 5) {
        allBetted = true;

        
        players[socket.id].bet = parseInt(currentBet) - parseInt(players[socket.id].roundBet)
        if (betType[0] == 'raise') {
          players[socket.id].bet += Math.abs(betType[1]);
        }
        
        /*if (players[socket.id].roundBet + players[socket.id].bet < currentBet) {
          players[socket.id].bet += currentBet - players[socket.id].roundBet;
        }*/

        if (players[socket.id].money >= players[socket.id].bet && players[socket.id].bet >= 0) {
          if (betType[0] == "call") {
            console.log("Call");
            players[socket.id].betted = true;
            players[socket.id].money -= players[socket.id].bet;
            players[socket.id].roundBet += players[socket.id].bet;
            pot += players[socket.id].bet;
            socket.emit('playerBet', players[socket.id].roundBet)
            players[socket.id].bet = 0;
            socket.emit("updateMoney", players[socket.id].money);
          } else if (betType[0] == "raise") {
              console.log("raise");
              players[socket.id].betted = true;
              players[socket.id].money -= players[socket.id].bet;
              players[socket.id].roundBet += players[socket.id].bet;
              currentBet = players[socket.id].roundBet;
              pot += players[socket.id].bet;
              socket.emit('playerBet', players[socket.id].roundBet)
              socket.emit("updateMoney", players[socket.id].money);
              for (let player in players) {
                if (player != socket.id && players[player].folded == false && players[socket.id].bet != 0) {
                  players[player].betted = false;
                }
              players[player].socket.emit("updateBet", [players[player].betted, currentBet]);
              }
            players[socket.id].bet = 0;

          } else {
            console.log("Fold");
            foldedPlayers.push(...playerTurn.splice(playerTurn.indexOf(players[socket.id].playerNum),1));
            i--;
            _backPlayerActions.folded = true;
            players[socket.id].hand = [];
            players[socket.id].folded = true;
            players[socket.id].bet = 0;
            if (playerTurn.length == 1) {_allBetted(true)}
          }

          if (i < playerTurn.length - 1) {
            i++;
          } else {
            i = 0;
          }

          updateArrow(i);
          io.emit('updatePot', pot)
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
        if (allBetted && playerTurn.length > 1) {
          currentBet = 0;
          i = 0;
          updateArrow(i);
          
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



function _allBetted(allFolded) {
  if (!allFolded) {
    io.emit("updateBet", [false, 0]);
    io.emit('playerBet', 0)
    if (comCards.length < 3) {
      comCards = deck.splice(0, 3);
      io.emit("nextCards", comCards);
    } else if (comCards.length < 5) {
      var newCard = deck.splice(0, 1)[0];
      comCards.push(newCard);
      io.emit("nextCards", comCards);
    } else {roundEnd()}
  }   
  else {
    roundEnd();
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
        if (players[player].money > blindValue * 2) {
        players[player].money -=
          blindValue * (playerTurn.indexOf(players[player].playerNum) + 1);
        players[player].roundBet = blindValue * (playerTurn.indexOf(players[player].playerNum) + 1);   
        pot += blindValue * (playerTurn.indexOf(players[player].playerNum) + 1);
      }
        players[player].socket.emit("updateMoney", players[player].money);
        players[player].socket.emit("playerBet",  blindValue * (playerTurn.indexOf(players[player].playerNum) + 1));
      }
      players[player].bet = 0;
      players[player].hand.push(...deck.splice(0, 2));
      players[player].socket.emit("dealCards", players[player].hand);
      playerCards.push(players[player].hand);
    }

  }
  playerTurn.push(playerTurn.shift());
  playerTurn.push(playerTurn.shift());
  currentBet = blindValue * 2;
  updateArrow(0);
  io.emit("newRound");
  io.emit("updateBet", ['', 50])
  io.emit('updatePot', pot)
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

function roundEnd() {
  for (let player in players) {
    var tempCards = [];
    tempCards.push(...playerCards);
    tempCards.splice(tempCards.indexOf(players[player].hand), 1);
    console.log(tempCards)
    players[player].socket.emit("showCards", tempCards);
  }
  for (let player in players) {
    if (players[player].folded == false && players[player].playing == true) {
      for (let card in comCards) {
        players[player].hand.push(comCards[card]);
      }
      comparisonArray.push({c: players[player].hand, p: players[player].playerNum});
      players[player].playing = null;
    } else {
      for (let card in comCards) {
        players[player].hand.push(comCards[card]);
      }
    }
  }
  if (comparisonArray.length > 1) {
    var winner = _handComparison.handComparison(comparisonArray);
    console.log(`Winner is player ${winner}`);
    var winners = [];
    var winnersUsernames = [];
    console.log(winner)
    winner.forEach(p => {
      winners.push(p.player)
    })
    for (let player in players) {
      if (winners.includes(players[player].playerNum)) {winnersUsernames.push("'"+players[player].username+"'")}
    }
  }  else {
    for (let player in players) {
      if (players[player].folded == false) {
        var winners = [players[player].playerNum];
        var winnersUsernames = [players[player].username]
      }
    }
  }
  for (let player in players) {
    players[player].socket.emit("roundOver", [
      winners,
      players[player].playerNum,
      _handEvaluation.handEvaluation(players[player].hand).name,
      winnersUsernames,
    ]);
    if (winners.includes(players[player].playerNum)) {
      players[player].money += Math.floor(pot / winners.length);
    }
    players[player].socket.emit("updateMoney", players[player].money);
    players[player].playing = null;
  }
  io.emit('optChoices', 'balls')
  gameStarted = false;
}

function checkOpted() {
  everyonePlaying = true;
  for (let player in players) {
    if (players[player].playing == null) {
      everyonePlaying = false;
    }
  }

  if (everyonePlaying &&  Object.keys(players).filter(key => players[key].playing == true).length >= 2 ) {
    console.log("NEW ROUND")
    newRound()
  }
}

server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
//Troubleshoot
//Add 10 second timer before round auto start once 2 players have joined
//Add a way to see if all players have betted 
//Keep play next round button to stay until round start
//add all in option when raising (type `all in` to go all in)
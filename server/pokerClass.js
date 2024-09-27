const _cards = require('./cards');
const _handComparison = require('./handComparison');
const _handEvaluation = require('./handEvaluation');

class PokerGame {
  constructor(io, roomID, blindValue, password, lobbyNum) {
    this.io = io
    this.password = password
    this.roomID = roomID
    this.lobbyNum = lobbyNum
    this.deck = [];
    this.players = {}; // Object to store player data
    this.playerTurn = []; // Array to store player turn order
    this.playerList = []; // Array to store player list
    this.playerCards = [] //Store each players original 2 cards
    this.gameStarted = false; // Flag to indicate if the game has started
    this.pot = 0; // The current pot value
    this.blindValue = blindValue; // The blind value
    this.currentBet = 0; // The current bet value
    this.i = 0; // Index to keep track of the current player's turn
    this.allBetted = false; // Flag to indicate if all players have betted
    this.gameNum = 0; // Number of games played
    this.everyonePlaying = false;
    this.timeLeft = 10; //time before round starts
    this.timer = null; //Timer
    this.NoOfPlayers = 0; //Amount of Players
    }

  // Method to add a player to the game
  addPlayer(socket, username, money) {
    this.players[socket.id] = {
      socket: socket,
      username: username,
      money: money,
      maxWin: money,
      playerNum: this.playerList.length + 1,
      bet: 0,
      roundBet: 0,
      totalbet: 0,
      betted: false,
      folded: false,
      playing: null,
      lastAction: '',
      hand: [],
    };
    this.NoOfPlayers++
    this.playerList.push({ p: this.players[socket.id].playerNum, n: username, m: money }); 
  } 

  // Method to remove a player from the game
  removePlayer(socketId, i) {
    if (this.players[socketId] != null) {
      const index = this.playerTurn.indexOf(this.players[socketId].playerNum);
      
      if (index < i) {
        this.i--;
      } //if the player who leaves was before the current move i back so that player doesnt lose their turn
      if (i > this.playerTurn.length - 1) {
        this.i = 0;
      }
      this.playerTurn = [];
      for (let player in this.players) {if (this.players[player].playerNum > this.players[socketId].playerNum) {this.players[player].playerNum--}}
      this.playerList.splice(this.playerList.findIndex((obj) => obj.n === this.players[socketId].username), 1);
      this.playerList.forEach(player => {
        if (player.p > this.players[socketId].playerNum) {
          player.p--
        }
        if (player.playing && !player.folded) {
          this.playerTurn.push(player.p)
        }
      })

      delete this.players[socketId];
  
      for (let p in this.players) { 
        this.players[p].socket.emit('updatePlayerList', this.getPlayers(), this.players[p].playerNum)
      }

      if (!this.gameStarted) {this.checkOpted()}
  
      if (this.playerTurn.length <= 1 && this.gameStarted) {
        this.gameStarted = false;
        for (let player in this.players) {
          if (this.players[player].playing == true) {this.players[player].money += this.pot;}
          this.players[player].playing = null;
          this.players[player].socket.emit('updatePlayerList', this.getPlayers(), this.players[player].playerNum)
        }
        this.NoOfPlayers--
        this.io.to(this.roomID).emit('optChoices', '<2');
        console.log("New game")
      }
    }
  }

  // Method to start the game
  startGame() {
    this.gameStarted = true;
    this.deck = [];
    _cards.deckCreate(this.deck);
    _cards.shuffle(this.deck);
    this.i = 0;
  }
  //Function to Start a new round
  newRound() {
    this.startGame()
    this.gameNum ++
    this.i = 0;
    this.pot = 0;
    this.playerTurn = [];
    this.comCards = [];
    this.playerCards = [];
    
    for (let player in this.players) {
      if (this.players[player].playing == true && this.players[player].money > this.blindValue * 2) {
        this.playerTurn.push(this.players[player].playerNum)
      }
    }
    this.playerTurn.sort((a, b ) => a - b)
    for (let e = 0; e < this.gameNum; e++) {this.playerTurn.push(this.playerTurn.shift())}
    
    for (let player in this.players) {
      if (this.players[player].playing == true) {
        this.players[player].hand = [];
        this.players[player].betted = false;
        this.players[player].folded = false;
        this.players[player].maxWin = this.players[player].money;
        if (this.players[player].playerNum == this.playerTurn[0] || this.players[player].playerNum == this.playerTurn[1]) {
          this.players[player].money -=
            this.blindValue * (this.playerTurn.indexOf(this.players[player].playerNum) + 1);
          this.players[player].roundBet = this.blindValue * (this.playerTurn.indexOf(this.players[player].playerNum) + 1);   
          this.players[player].totalbet  = this.blindValue * (this.playerTurn.indexOf(this.players[player].playerNum) + 1);
          this.pot += this.blindValue * (this.playerTurn.indexOf(this.players[player].playerNum) + 1);
          this.players[player].socket.emit("updateMoney", this.players[player].money);
          this.players[player].socket.emit("playerBet",  this.blindValue * (this.playerTurn.indexOf(this.players[player].playerNum) + 1));

          if (this.players[player].playerNum == this.playerTurn[0]) {
            this.players[player].lastAction = "Played Small Blind"
          } else {this.players[player].lastAction = "Played Big Blind"}
        }
        this.players[player].bet = 0;
        this.players[player].hand.push(...this.deck.splice(0, 2));
        this.players[player].socket.emit("dealCards", this.players[player].hand);
        this.playerCards.push(this.players[player].hand);
      }
    }
    this.playerTurn.push(this.playerTurn.shift());
    this.playerTurn.push(this.playerTurn.shift());
    this.currentBet = this.blindValue * 2;

    this.updateArrow(this.playerTurn[this.i])
    this.io.to(this.roomID).emit("newRound");
    this.io.to(this.roomID).emit("updateBet", ['', this.blindValue * 2])
    this.io.to(this.roomID).emit('updatePot', this.pot)
    this.io.to(this.roomID).emit('showCards', 'new round')

    for (let player in this.players) {
      this.players[player].socket.emit('updatePlayerList', this.getPlayers(), this.players[player].playerNum)
    }
  }

  // Method to handle player betting
  playerBet(socketId, betType, amount) {
    if (this.gameStarted && this.players[socketId].playing && !this.players[socketId].folded && this.players[socketId].playerNum == this.playerTurn[this.i]) {
      const player = this.players[socketId];
      const playerIndex = this.playerList.findIndex((obj) => obj.n == this.players[socketId].username)

      player.bet = parseInt(this.currentBet) - parseInt(player.roundBet)

      if (betType == 'raise') {
        player.bet = this.currentBet + Math.abs(amount);
        if (player.bet > player.money) {player.bet = player.money}
      }

      console.log(player.bet, player.money, betType, player.roundBet, this.currentBet)
      if (player.money >= player.bet && player.bet >= 0 && player.money > 0) {
        
        if (betType === 'call') {
            player.money -= player.bet;
            this.pot += player.bet;
            player.roundBet += player.bet;
            player.betted = true;
            player.lastAction = `Called £${player.roundBet}`
            player.totalbet += player.bet;
        } else if (betType === 'raise') {
            player.money -= player.bet - player.roundBet;
            this.pot += player.bet;
            player.roundBet += player.bet - player.roundBet;
            this.currentBet += amount;
            player.betted = true;
            player.lastAction = `Raised to £${player.roundBet}`
            player.totalbet += player.bet;
            for (let p in this.players) {
              if (p != socketId && this.players[p].folded == false && this.players[socketId].bet != 0) {
                this.players[p].betted = false;
              }
            this.players[p].socket.emit("updateBet", [this.players[p].betted, this.currentBet]);
            }
        } else if (betType === 'fold') {
          player.folded = true;
          player.playing = false;
          this.playerTurn.splice(this.playerTurn.indexOf(this.players[socketId].playerNum),1)
          player.lastAction = `Folded`
          this.i--;
        }
      } else {if(betType == 'raise'){player.betted = true, this.pot += player.money, player.totalbet = player.maxWin, player.money = 0, player.lastAction = "All in"}else console.log("insufficient funds to match"), player.betted = true, player.totalbet = player.maxWin, this.pot += player.money, player.money = 0, player.lastAction = "Called (insufficient funds)"}

      if (this.i < this.playerTurn.length - 1) {
        this.i++;
      } else {
        this.i = 0;
      }

      for (let player in this.players) {
        this.players[player].socket.emit('updatePlayerList', this.getPlayers(), this.players[player].playerNum)
      }

      player.bet = 0;
      player.socket.emit('playerBet', this.players[socketId].roundBet)
      this.io.to(this.roomID).emit("updatePot", this.pot);
      if (this.checkAllBetted() || this.playerTurn.length < 2) {
        this._allBetted();
        this.currentBet = 0;
        this.i = 0;
        for (let player in this.players) {
          this.players[player].betted = false;
          this.players[player].roundBet = 0;
          this.players[player].socket.emit("updateBet", [this.players[player].betted, this.currentBet]);
          this.players[player].socket.emit('playerBet', this.players[player].roundBet)
        }
      }
      this.updateArrow(this.playerTurn[this.i])
    }
  }

  // Method to check if all players have betted
  checkAllBetted() {
    this.allBetted = true;
    for (let player in this.players) {
      if (this.players[player].playing && !this.players[player].betted && !this.players[player].folded) {
        this.allBetted = false;
      }
    }
    return this.allBetted;
  }  

  // Method to handle player opt-in
  playerOptIn(socketId, vote) {
    if (this.gameStarted) return;
    if (vote && this.players[socketId].money >= this.blindValue * 2) {
      this.players[socketId].playing = true;
    } else {
      this.players[socketId].playing = false;
    }
    this.checkOpted();
  }

  // Method to check if all players have opted-in
  checkOpted() {
    this.everyonePlaying = true;
    for (let player in this.players) {
      if (this.players[player].playing == null) {
        this.everyonePlaying = false;
      }
    }

    if (this.everyonePlaying &&  Object.keys(this.players).filter(key => this.players[key].playing == true).length >= 2 ) {
      console.log("NEW ROUND")
      this.newRound()
      return;
    }
    this.timeLeft = 10;
    if ((Object.keys(this.players).filter(key => this.players[key].playing == true).length) / Object.keys(this.players).length >= 0.5 && Object.keys(this.players).length > 2)  {
      this.io.to(this.roomID).emit("updateTimer", this.timeLeft, false);
    }
    
    this.updateTimer();
  }

  updateTimer() {
    if (this.timer) clearTimeout(this.timer);
    
    var over = false;
    if (!this.everyonePlaying) {
      if (this.timeLeft > 0) {
        if ((Object.keys(this.players).filter(key => this.players[key].playing == true).length) / Object.keys(this.players).length >= 0.5 && Object.keys(this.players).length > 2)  {
          this.timeLeft--;
          this.io.to(this.roomID).emit("updateTimer", this.timeLeft, false);
        } else {this.io.to(this.roomID).emit("updateTimer", this.timeLeft, true); over = true;}
      } else {console.log("new round"); this.newRound(); this.io.to(this.roomID).emit("updateTimer", this.timeLeft, true); over = true;}
    } else {this.io.to(this.roomID).emit("updateTimer", this.timeLeft, true); return;}
    if (this.timeLeft >= 0 && !over) {
      this.timer = setTimeout(() => {
        this.updateTimer();
      }, 1000);
    }
  }
  
  _allBetted(allFolded) {
    if (this.playerTurn.length > 1) {
      if (this.comCards.length < 3) {
        this.comCards.push(...this.deck.splice(0, 3));
        this.io.to(this.roomID).emit("nextCards", this.comCards);
      } else if (this.comCards.length < 5) {
        this.comCards.push(...this.deck.splice(0, 1));
        this.io.to(this.roomID).emit("nextCards", this.comCards);
      } else {this.roundEnd()}
    } else {
      this.comCards.push(...this.deck.splice(0, 5 - this.comCards.length))
      this.roundEnd()
    }
  }

  roundEnd() {
    var comparisonArray = [];
    var winningStatement = "";
    var winningUsernames = [];

    //displaying each players cards
    for (let player in this.players) {
      var tempCards = [];
      tempCards.push(...this.playerCards); 
      tempCards.splice(tempCards.indexOf(this.players[player].hand), 1); //removing the players cards from the array
      this.players[player].socket.emit("showCards", tempCards);
    }

    //adding the community cards to each players' hand
    for (let player in this.players) {
      if (this.players[player].folded == false && this.players[player].playing == true) {
        for (let card in this.comCards) {
          this.players[player].hand.push(this.comCards[card]);
        }
        comparisonArray.push({c: this.players[player].hand, p: this.players[player].playerNum})
      } else {
        for (let card in this.comCards) {
          this.players[player].hand.push(this.comCards[card]);
        }
      }
    }

    //added sidepots
    var sidePlayers = []; // only include players that are playing
    for (let player in this.players) {
      if (this.players[player].playing == true && this.players[player].folded != true) {
        sidePlayers.push(this.players[player])
      }
    }
    Object.values(sidePlayers).sort((a, b) => a.totalbet - b.totalbet); //sort the players by their max wins

    var sidepots = []

    if (sidepots.length > 1) {
      for (let i = 0; i < Object.keys(sidePlayers).length; i++) {
        if (i !=  Object.keys(sidePlayers).length - 1) {
          if (sidePlayers[i].totalbet < sidePlayers[i + 1].totalbet) {
            var elligablePlayers = []
            for (let e = i; e < Object.keys(sidePlayers).length; e++) {
              elligablePlayers.push(sidePlayers[e])
            }
            sidepots.push( { pot: sidePlayers[i].totalbet * Object.keys(this.players).filter(player => this.players[player].totalbet >= sidePlayers[i].totalbet).length, players: elligablePlayers } );
          }
        }
        else {
          if (sidePlayers[i].totalbet > sidePlayers[i-1].totalbet) {
            this.players[sidePlayers[i].socket.id].money +=  sidePlayers[i].totalbet - sidePlayers[i-1].totalbet;
          }
        }
      }
    }

    if (sidepots.length == 0 && sidePlayers.length > 0) {
      sidepots.push( {pot: this.pot, players: sidePlayers} )
    }

    for (let sidepot in sidepots) {
      var elligablePlayers = []
      console.log(sidepot)
      if (sidepot == 0) {winningStatement +=  "Main Pot " + (parseInt(sidepots[sidepot].pot)) + " winners: "}
      else {winningStatement +=  "Sidepot " + (parseInt(sidepots[sidepot].pot)) + " winners: ";}

      for  (let player in sidepots[sidepot].players) { 
        elligablePlayers.push({c: sidepots[sidepot].players[player].hand, p: sidepots[sidepot].players[player].playerNum, n: sidepots[sidepot].players[player].username});
      }
      var sidepotWinner = _handComparison.handComparison(elligablePlayers)
    
      for (let winner of sidepotWinner) { //Seems silly but done so cant trick the code by making name = the name of the hand 
        for (let player in this.players) {
          if (winner.username == this.players[player].username) { //swapped to username so if someone leaves its more robust
            this.players[player].money += sidepots[sidepot].pot / sidepotWinner.length;
            winningUsernames.push(this.players[player].username)
            winningStatement += this.players[player].username + ", "
          }
        }
      }
    }

    for (let player in this.players) {
      this.players[player].socket.emit('roundOver2', {
        winners: winningUsernames,
        winningStatement: winningStatement,
        username: this.players[player].username,
      }) 

      this.players[player].lastAction = ""
    }

    /*
    for (let player in this.players) {
      this.players[player].socket.emit("roundOver", [
        winners,
        this.players[player].playerNum,
        _handEvaluation.handEvaluation(this.players[player].hand).name,
        winnersUsernames,
      ]);
      
      if (winners.includes(this.players[player].playerNum)) {
        this.players[player].money += Math.floor(this.pot / winners.length);
      }
      this.players[player].playing = null;
    }
    */

    for (let player in this.players) {
      this.players[player].socket.emit('updatePlayerList', this.getPlayers(), this.players[player].playerNum)
      this.players[player].playing = null;
    }

    this.io.to(this.roomID).emit('optChoices', 'balls')
    this.io.to(this.roomID).emit("nextCards", '');
    this.io.to(this.roomID).emit('updatePot', 0)
    this.gameStarted = false;
  }

  updateArrow(i) {
    for (let player in this.players) {
      this.players[player].playerNum
      this.players[player].socket.emit("moveArrow", i, this.players[player].playerNum);
    }
  }

  getPlayers() {
    var gotPlayers = [];
    for (let player in this.players) {
      gotPlayers.push( {playerNum: this.players[player].playerNum, username: this.players[player].username, money: this.players[player].money, folded: this.players[player].folded, playing: this.players[player].playing, bet: this.players[player].bet, roundBet: this.players[player].roundBet, lastAction: this.players[player].lastAction } );
    }
    return gotPlayers;
  }
}

module.exports = PokerGame;

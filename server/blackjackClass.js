class Blackjack {
    constructor(io, roomId, password, lobbyNum, isFiveCardRule, MAX_PLAYERS) {
        this.io = io;
        this.roomId = roomId;
        this.password = password;
        this.lobbyNum = lobbyNum;
        this.isFiveCardRule = isFiveCardRule;
        this.players = {};
        this.turnOrder = []; 
        this.noOfPlayers = 0;
        this.playersHaveMadeChoice = 0;
        this.playingPlayers = 0;
        this.deck = [];
        this.dealerHand = [];
        this.MAX_PLAYERS = MAX_PLAYERS;
    }

    addPlayer( socket, username, money, playerNumber) {
        try {
        // Validate parameters
        if (!socket || !username || typeof money !== 'number') {
          throw new Error("Invalid parameters for adding player.");
        }
        // Add player data to the players object
        this.players[socket.id] = {
          socket: socket,
          username: username,
          money: money,
          playerNumber: playerNumber,
          bet: 0, 
          totalBet: 0, 
          betted: false,
          playing: null,
          hasSplit: false,
          lastAction: '',
          moveNumber: 0,
          hand: [], 
          splitHand: [],
        };
        this.noOfPlayers++; 
        } catch (error) {
          console.error("Error adding player:", error.message, { socketId: socket.id, username, money });
        }
    }

    removePlayer(socketId) {
    try {
      const playerToRemove = this.players[socketId]
      // Check if player exists
      if (!playerToRemove) {
        throw new Error("Player not found.");
      }
      
      this.turnOrder[playerToRemove.playerNumber] = ""
      

      if (playerToRemove.playing) {
        this.playingPlayers--
        if (playerToRemove.betted) {
          this.playersHaveMadeChoice--;
        }
      }

      delete this.players[socketId];
      this.noOfPlayers--;

    } catch (error) {
      // Log error if removing player fails
      console.error("Error removing player:", error.message, { socketId });
    }
  }

  playerMakesMove( moveType, socketId ) {
    try {

      const playerToMakeMove = this.players[socketId];

      if ( moveType === "hit" ) {
        this.dealCard(socketId);
      } 
      else if ( moveType === "stand") {
        playerToMakeMove.playing = false;
      }
      else if ( moveType === "doubledown") {
        if ( playerToMakeMove.moveNumber === 1) {
          playerToMakeMove.bet = playerToMakeMove.bet * 2;
          this.dealCard( socketId );
          playerToMakeMove.playing = false;
        } else {
          var reason = "Not first turn";
          this.failedToMakeMove( reason, socketId );
          return
        }
      }
      else if ( moveType === "split" ) {
        playerToMakeMove.hasSplit = true;
        playerToMakeMove = this.dealCard( socketId, 2, true )
        console.log("such a pain to write")
      }
      else if ( moveType === "insurance" ) {
        if (this.dealerHand.some(card => card.v === 14) && this.dealerHand.some(card => card.v === 10)) {
          playerToMakeMove.money += playerToMakeMove.bet;
        } else {
          playerToMakeMove.money -= Math.floor(playerToMakeMove.bet / 2);
        }
      }

      this.playersHaveMadeChoice++;
      
    }
    catch {
      console.log("Failed to make move")
    }
  }

  failedToMakeMove(reason, socketId) {
    return;
  }

  dealCard( socketId, amount = 1, isSplit = false ) {
    try {
      if (!isSplit) {
        this.players[socketId].hand.push(...this.deck.splice(0, amount));
        this.io.emit("dealCard", this.players[socketId].hand);
      } 
      else {
        this.players[socketId].splitHand.push(...this.deck.splice( 0, amount ));
        this.io.emit("dealCard", this.players[socketId].splitHand);
      }
    } 
    catch {
      console.error("Failed to deal card")
    }
  }
}

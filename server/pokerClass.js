// Importing required modules for card handling and hand comparison
const _cards = require('./cards');
const _handComparison = require('./handComparison');
const _handEvaluation = require('./handEvaluation');

// Class representing a Poker game
class PokerGame {
  // Constructor to initialize the game with necessary parameters
  constructor(io, roomID, blindValue, password, lobbyNum) {
    this.io = io; // Socket.io instance for real-time communication
    this.password = password; // Room password for security
    this.roomID = roomID; // Unique identifier for the game room
    this.lobbyNum = lobbyNum; // Lobby number for tracking
    this.deck = []; // Array to hold the deck of cards
    this.players = {}; // Object to store player data
    this.playerTurn = []; // Array to store the order of players' turns
    this.playerList = []; // Array to store the list of players
    this.playerCards = []; // Store each player's original 2 cards
    this.gameStarted = false; // Flag to indicate if the game has started
    this.pot = 0; // The current pot value
    this.blindValue = blindValue; // The blind value for betting
    this.currentBet = 0; // The current bet value
    this.i = 0; // Index to keep track of the current player's turn
    this.allBetted = false; // Flag to indicate if all players have betted
    this.gameNum = 0; // Number of games played
    this.everyonePlaying = false; // Flag to check if all players have opted in
    this.timeLeft = 10; // Time before round starts
    this.timer = null; // Timer for managing timeouts
    this.NoOfPlayers = 0; // Amount of Players
  }

  // Method to add a player to the game
  addPlayer(socket, username, money) {
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
        maxWin: money, // Maximum win amount for the player
        playerNum: this.playerList.length + 1, // Assign player number
        bet: 0, // Current bet amount
        roundBet: 0, // Bet amount for the current round
        totalbet: 0, // Total bet amount
        betted: false, // Flag to check if player has betted
        folded: false, // Flag to check if player has folded
        playing: null, // Flag to check if player is active
        lastAction: '', // Last action taken by the player
        hand: [], // Array to hold player's hand (cards)
      };
      this.NoOfPlayers++; // Increment player count
      // Add player to the player list
      this.playerList.push({ p: this.players[socket.id].playerNum, n: username, m: money });
    } catch (error) {
      // Log error if adding player fails
      console.error("Error adding player:", error.message, { socketId: socket.id, username, money });
    }
  }

  // Method to remove a player from the game
  removePlayer(socketId, i) {
    try {
      // Check if player exists
      if (!this.players[socketId]) {
        throw new Error("Player not found.");
      }
      // Get the index of the player in the turn order
      const index = this.playerTurn.indexOf(this.players[socketId].playerNum);

      // Adjust the current turn index if necessary
      if (index < i) {
        this.i--;
      }
      if (i > this.playerTurn.length - 1) {
        this.i = 0;
      }
      this.playerTurn = []; // Reset player turn array
      // Update player numbers for remaining players
      for (let player in this.players) {
        if (this.players[player].playerNum > this.players[socketId].playerNum) {
          this.players[player].playerNum--;
        }
      }
      // Remove player from the player list
      this.playerList.splice(this.playerList.findIndex((obj) => obj.n === this.players[socketId].username), 1);
      // Update player turn array and player list
      this.playerList.forEach(player => {
        if (player.p > this.players[socketId].playerNum) {
          player.p--;
        }
        if (player.playing && !player.folded && player.money > 0) {
          this.playerTurn.push(player.p);
        }
      });

      // Delete the player from the players object
      delete this.players[socketId];
      this.NoOfPlayers--; // Decrement player count

      // Notify remaining players of the updated player list
      for (let p in this.players) {
        this.players[p].socket.emit('updatePlayerList', this.getPlayers(), this.players[p].playerNum);
      }

      // Check if the game is still in the lobby
      if (!this.gameStarted) {
        this.checkOpted();
      }

      // If only one player remains, end the game
      if (this.playerTurn.length <= 1 && this.gameStarted) {
        this.gameStarted = false; // End the game
        for (let player in this.players) {
          if (this.players[player].playing == true) {
            this.players[player].money += this.pot; // Return pot to the remaining player
          }
          this.players[player].playing = null; // Reset playing status
          this.players[player].socket.emit('updatePlayerList', this.getPlayers(), this.players[player].playerNum);
        }
        this.NoOfPlayers--; // Decrement player count
        this.io.to(this.roomID).emit('optChoices', '<2'); // Notify players of game end
      }
    } catch (error) {
      // Log error if removing player fails
      console.error("Error removing player:", error.message, { socketId, index: i });
    }
  }

  // Method to start the game
  startGame() {
    try {
      this.gameStarted = true; // Set game started flag
      this.deck = []; // Reset the deck
      _cards.deckCreate(this.deck); // Create a new deck
      _cards.shuffle(this.deck); // Shuffle the deck
      this.i = 0; // Reset the turn index
    } catch (error) {
      // Log error if starting game fails
      console.error("Error starting game:", error.message);
    }
  }

  // Function to start a new round
  newRound() {
    try {
      this.startGame(); // Start the game
      this.gameNum++; // Increment game number
      this.i = 0; // Reset turn index
      this.pot = 0; // Reset pot
      this.playerTurn = []; // Reset player turn array
      this.comCards = []; // Reset community cards
      this.playerCards = []; // Reset player cards

      // Determine which players are active for this round
      for (let player in this.players) {
        if (this.players[player].playing == true && this.players[player].money >= this.blindValue * 2) {
          this.playerTurn.push(this.players[player].playerNum); // Add active players to turn order
        }
      }
      this.playerTurn.sort((a, b) => a - b); // Sort player turn order
      // Rotate player turn order based on game number
      for (let e = 0; e < this.gameNum; e++) {
        this.playerTurn.push(this.playerTurn.shift());
      }

      // Deal cards and manage betting for each player
      for (let player in this.players) {
        if (this.players[player].playing == true) {
          this.players[player].hand = []; // Reset player's hand
          this.players[player].betted = false; // Reset bet status
          this.players[player].folded = false; // Reset fold status
          this.players[player].maxWin = this.players[player].money; // Set max win to current money
          // Handle blinds for the first two players in turn order
          if (this.players[player].playerNum == this.playerTurn[0] || this.players[player].playerNum == this.playerTurn[1]) {
            this.players[player].money -= this.blindValue * (this.playerTurn.indexOf(this.players[player].playerNum) + 1);
            this.players[player].roundBet = this.blindValue * (this.playerTurn.indexOf(this.players[player].playerNum) + 1);
            this.players[player].totalbet = this.blindValue * (this.playerTurn.indexOf(this.players[player].playerNum) + 1);
            this.pot += this.blindValue * (this.playerTurn.indexOf(this.players[player].playerNum) + 1);
            this.players[player].socket.emit("updateMoney", this.players[player].money); // Notify player of updated money
            this.players[player].socket.emit("playerBet", this.blindValue * (this.playerTurn.indexOf(this.players[player].playerNum) + 1)); // Notify player of their bet

            // Set last action based on whether the player played small or big blind
            if (this.players[player].playerNum == this.playerTurn[0]) {
              this.players[player].lastAction = "Played Small Blind";
            } else {
              this.players[player].lastAction = "Played Big Blind";
            }
          }
          this.players[player].bet = 0; // Reset current bet
          this.players[player].hand.push(...this.deck.splice(0, 2)); // Deal 2 cards to the player
          this.players[player].socket.emit("dealCards", this.players[player].hand); // Send dealt cards to player
          this.playerCards.push(this.players[player].hand); // Store player's hand
        }
      }
      // Rotate the turn order for the next player
      // this.playerTurn.push(this.playerTurn.shift());
      // this.playerTurn.push(this.playerTurn.shift());
      this.i = (this.playerTurn.length > 3) ? 2 : 0;
      this.currentBet = this.blindValue * 2; // Set current bet to double the blind

      this.updateOutline(this.playerTurn[this.i]); // Update the arrow to indicate current player
      this.io.to(this.roomID).emit("newRound"); // Notify all players of the new round
      this.io.to(this.roomID).emit("updateBet", ['', this.blindValue * 2]); // Update bet information
      this.io.to(this.roomID).emit('updatePot', this.pot); // Update pot information
      this.io.to(this.roomID).emit('showCards', 'new round'); // Notify players to show cards

      // Update player list for all players
      for (let player in this.players) {
        this.players[player].socket.emit('updatePlayerList', this.getPlayers(), this.players[player].playerNum);
      }
    } catch (error) {
      // Log error if starting new round fails
      console.error("Error starting new round:", error.message);
    }
  }

  // Method to handle player betting
  playerBet(socketId, betType, amount) {
    try {
      // Check if the game is started and it's the player's turn
      if (this.gameStarted && this.players[socketId].playing && !this.players[socketId].folded && this.players[socketId].playerNum == this.playerTurn[this.i]) {
        const player = this.players[socketId]; // Get the player object
        const playerIndex = this.playerList.findIndex((obj) => obj.n == this.players[socketId].username); // Find player index in the list

        // Calculate the player's bet based on the current bet and their round bet
        player.bet = parseInt(this.currentBet) - parseInt(player.roundBet);

        // Handle different betting actions
        if (betType == 'raise') {
          player.bet = this.currentBet + Math.abs(amount); // Set bet to raise amount
          if (player.bet > player.money) {
            player.bet = player.money; // Limit bet to available money
          }
        }

        
        // Check if the player can afford the bet
        if (player.money >= player.bet && player.bet >= 0 && player.money > 0) {
          if (betType === 'call' || player.bet === this.roundBet) {
            player.money -= player.bet; // Deduct bet from player's money
            this.pot += player.bet; // Add bet to the pot
            player.roundBet += player.bet; // Update round bet
            player.betted = true; // Mark player as having betted
            player.lastAction = `Called £${player.roundBet}`; // Update last action
            player.totalbet += player.bet; // Update total bet
          } else if (betType === 'raise') {
            player.money -= player.bet - player.roundBet; // Deduct the difference from player's money
            this.pot += player.bet; // Add bet to the pot
            player.roundBet += player.bet - player.roundBet; // Update round bet
            this.currentBet = parseInt(player.roundBet); // Update current bet
            player.betted = true; // Mark player as having betted
            player.lastAction = `Raised to £${player.roundBet}`; // Update last action
            player.totalbet += player.bet; // Update total bet
            // Notify other players of the new bet
            for (let p in this.players) {
              if (p != socketId && this.players[p].folded == false && this.players[socketId].bet != 0) {
                this.players[p].betted = false; // Reset bet status for other players
              }
              this.players[p].socket.emit("updateBet", [this.players[p].betted, this.currentBet]); // Update bet information for other players
            }
          } else if (betType === 'fold') {
            player.folded = true; // Mark player as folded
            player.playing = false; // Mark player as not playing
            this.playerTurn.splice(this.playerTurn.indexOf(this.players[socketId].playerNum), 1); // Remove player from turn order
            player.lastAction = `Folded`; // Update last action
            this.i--; // Adjust turn index

          }
        } else {
          // Handle all-in situations
          if (betType == 'raise') {
            player.betted = true; // Mark player as having betted
            this.pot += player.money; // Add all remaining money to the pot
            player.totalbet = player.maxWin; // Set total bet to max win
            player.money = 0; // Set player's money to zero
            player.lastAction = "All in"; // Update last action
          } else {
            player.betted = true; // Mark player as having betted
            player.totalbet = player.maxWin; // Set total bet to max win
            this.pot += player.money; // Add all remaining money to the pot
            player.money = 0; // Set player's money to zero
            player.lastAction = "All in"; // Update last action
          }
          this.playerTurn.splice(this.i, 1); // Remove player from turn order
          this.i--; // Adjust turn index
        }

        // Move to the next player's turn
        if (this.i < this.playerTurn.length - 1) {
          this.i++;
        } else {
          this.i = 0; // Reset to the first player
        }

        // Update player list for all players
        for (let player in this.players) {
          this.players[player].socket.emit('updatePlayerList', this.getPlayers(), this.players[player].playerNum);
        }

        player.bet = 0; // Reset player's bet
        player.socket.emit('playerBet', this.players[socketId].roundBet); // Notify player of their round bet
        this.io.to(this.roomID).emit("updatePot", this.pot); // Update pot information
        // Check if all players have betted or if there are no players left
        if (this.checkAllBetted() || this.playerTurn.length <= 1) {
          this._allBetted(); // Process all betted
          this.currentBet = 0; // Reset current bet
          this.i = 0; // Reset turn index
          // Reset betting information for all players
          for (let player in this.players) {
            this.players[player].betted = false; // Reset bet status
            this.players[player].roundBet = 0; // Reset round bet
            this.players[player].socket.emit("updateBet", [this.players[player].betted, this.currentBet]); // Update bet information
            this.players[player].socket.emit('playerBet', this.players[player].roundBet); // Notify player of their round bet
          }
        }
        this.updateOutline(this.playerTurn[this.i]); // Update the arrow to indicate current player
      }
    } catch (error) {
      // Log error if handling player bet fails
      console.error("Error handling player bet:", error.message, { socketId, betType, amount });
    }
  }

  // Method to check if all players have betted
  checkAllBetted() {
    try {
      this.allBetted = true; // Assume all players have betted
      // Check each player to see if they have betted
      for (let player in this.players) {
        if (this.players[player].playing && !this.players[player].betted && !this.players[player].folded) {
          this.allBetted = false; // If any player hasn't betted, set flag to false
        }
      }
      return this.allBetted; // Return the result
    } catch (error) {
      // Log error if checking all betted fails
      console.error("Error checking if all players have betted:", error.message);
    }
  }

  // Method to handle player opt-in
  playerOptIn(socketId, vote) {
    try {
      if (this.gameStarted) return; // If the game has started, ignore opt-in
      // Set player's playing status based on their vote
      if (vote && this.players[socketId].money >= this.blindValue * 2) {
        this.players[socketId].playing = true; // Player opts in
      } else {
        this.players[socketId].playing = false; // Player opts out
      }
      this.checkOpted(); // Check if all players have opted in
    } catch (error) {
      // Log error if handling player opt-in fails
      console.error("Error handling player opt-in:", error.message, { socketId, vote });
    }
  }

  // Method to check if all players have opted-in
  checkOpted() {
    try {
      this.everyonePlaying = true; // Assume everyone has opted in
      // Check each player to see if they have opted in
      for (let player in this.players) {
        if (this.players[player].playing == null) {
          this.everyonePlaying = false; // If any player hasn't opted in, set flag to false
        }
      }

      // If everyone has opted in and there are at least 2 players, start a new round
      if (this.everyonePlaying && Object.keys(this.players).filter(key => this.players[key].playing == true).length >= 2) {
        this.newRound(); // Start a new round
        return;
      }
      this.timeLeft = 10; // Reset timer
      // If more than half of players have opted in, update the timer display
      if ((Object.keys(this.players).filter(key => this.players[key].playing == true).length) / Object.keys(this.players).length >= 0.5 && Object.keys(this.players).length > 2) {
        this.io.to(this.roomID).emit("updateTimer", this.timeLeft, false); // Update timer display
      }

      this.updateTimer(); // Update the timer
    } catch (error) {
      // Log error if checking opted players fails
      console.error("Error checking if all players have opted-in:", error.message);
    }
  }

// Method to update the timer
  updateTimer() {
    if (this.timer) clearTimeout(this.timer); // Clear existing timer


    var over = false; // Flag to check if time is over
    // If not everyone has opted in
    if (!this.everyonePlaying) {
      if (this.timeLeft > 0) {
        // If more than half of players have opted in, decrement the timer
        if ((Object.keys(this.players).filter(key => this.players[key].playing == true).length) / Object.keys(this.players).length >= 0.5 && Object.keys(this.players).length > 2) {
          this.timeLeft--; // Decrement time left
          this.io.to(this.roomID).emit("updateTimer", this.timeLeft, false); // Update timer display
        } else {
          this.io.to(this.roomID).emit("updateTimer", this.timeLeft, true); // Update timer display with warning
          over = true; // Set over flag
        }
      } else {
        this.newRound(); // Start a new round
        this.io.to(this.roomID).emit("updateTimer", this.timeLeft, true); // Update timer display
        over = true; // Set over flag
      }
    } else {
      this.io.to(this.roomID).emit("updateTimer", this.timeLeft, true); // Update timer display if everyone has opted in
      return; // Exit if everyone has opted in
    }
    // If time is still left and not over, set a timeout to update the timer again
    if (this.timeLeft >= 0 && !over) {
      this.timer = setTimeout(() => {
        this.updateTimer(); // Call updateTimer again after 1 second
      }, 1000);
 	}
 }

  // Method to handle the situation when all players have betted
  _allBetted() {
    try {
      // Check if there are enough players to continue
      if (this.playerTurn.length > 1 && Object.keys(this.players).filter(key => this.players[key].money > 0).length > 1) {
        // If there are less than 3 community cards, deal 3 cards
        if (this.comCards.length < 3) {
          this.comCards.push(...this.deck.splice(0, 3)); // Deal 3 community cards
          this.io.to(this.roomID).emit("nextCards", this.comCards); // Notify players of new community cards
        } else if (this.comCards.length < 5) {
          this.comCards.push(...this.deck.splice(0, 1)); // Deal 1 community card
          this.io.to(this.roomID).emit("nextCards", this.comCards); // Notify players of new community cards
        } else {
          this.roundEnd(); // End the round if all community cards are dealt
        }
      } else {
        // If not enough players, deal remaining community cards
        this.comCards.push(...this.deck.splice(0, 5 - this.comCards.length)); // Deal remaining community cards
        this.io.to(this.roomID).emit("nextCards", this.comCards);
        this.roundEnd(); // End the round
      }
    } catch (error) {
      // Log error if processing all betted fails
      console.error("Error processing all betted:", error.message);
    }
  }

  // Method to end the round and determine winners
roundEnd() {
  try {
    var comparisonArray = []; // Array to hold players' hands for comparison
    var winningStatement = ""; // String to hold the winning statement
    var winningUsernames = []; // Array to hold usernames of winners

    // Displaying each player's cards
    for (let player in this.players) {
      var tempCards = [];
      tempCards.push(...this.playerCards); // Copy player cards
      tempCards.splice(tempCards.indexOf(this.players[player].hand), 1); // Remove the player's cards from the array
      this.players[player].socket.emit("showCards", tempCards); // Show cards to the player
    }

    // Adding the community cards to each player's hand
    for (let player in this.players) {
      if (this.players[player].folded == false && this.players[player].playing == true) {
        for (let card in this.comCards) {
          this.players[player].hand.push(this.comCards[card]); // Add community cards to player's hand
        }
        comparisonArray.push({ c: this.players[player].hand, p: this.players[player].playerNum }); // Prepare for comparison
      } else {
        for (let card in this.comCards) {
          this.players[player].hand.push(this.comCards[card]); // Add community cards to folded player's hand
        }
      }
    }

    // Added sidepots
    var sidePlayers = []; // Only include players that are playing
    for (let player in this.players) {
      if (this.players[player].playing == true && this.players[player].folded != true) {
        sidePlayers.push(this.players[player]); // Add active players to sidePlayers
      }
    }
    Object.values(sidePlayers).sort((a, b) => a.totalbet - b.totalbet); // Sort the players by their total bets

    var sidepots = []; // Array to hold side pots

    // Determine side pots based on players' total bets
    if (sidepots.length > 1) {
      for (let i = 0; i < Object.keys(sidePlayers).length; i++) {
        if (i != Object.keys(sidePlayers).length - 1) {
          if (sidePlayers[i].totalbet < sidePlayers[i + 1].totalbet) {
            var elligablePlayers = []; // Array to hold eligible players for the side pot
            for (let e = i; e < Object.keys(sidePlayers).length; e++) {
              elligablePlayers.push(sidePlayers[e]); // Add eligible players to the array
            }
            sidepots.push({ pot: sidePlayers[i].totalbet * Object.keys(this.players).filter(player => this.players[player].totalbet >= sidePlayers[i].totalbet).length, players: elligablePlayers }); // Create a side pot
          }
        } else {
          if (sidePlayers[i].totalbet > sidePlayers[i - 1].totalbet) {
            this.players[sidePlayers[i].socket.id].money += sidePlayers[i].totalbet - sidePlayers[i - 1].totalbet; // Adjust money for the last player
          }
        }
      }
    }

    // If no side pots, create a main pot
    if (sidepots.length == 0 && sidePlayers.length > 0) {
      sidepots.push({ pot: this.pot, players: sidePlayers }); // Create main pot
    }

    // Determine winners for each side pot
    for (let sidepot in sidepots) {
      var elligablePlayers = []; // Array to hold eligible players for the current side pot
      if (sidepot == 0) {
        winningStatement += "Main Pot " + (parseInt(sidepots[sidepot].pot)) + " winners: "; // Add main pot information to winning statement
      } else {
        winningStatement += "Sidepot " + (parseInt(sidepots[sidepot].pot)) + " winners: "; // Add side pot information to winning statement
      }

      // Prepare eligible players for hand comparison
      for (let player in sidepots[sidepot].players) {
        elligablePlayers.push({ c: sidepots[sidepot].players[player].hand, p: sidepots[sidepot].players[player].playerNum, n: sidepots[sidepot].players[player].username });
      }
      var sidepotWinner = _handComparison.arrayHandComparison(elligablePlayers); // Determine winners using hand comparison

      // Distribute winnings to the winners
      for (let winner of sidepotWinner) {
        for (let player in this.players) {
          if (winner.username == this.players[player].username) {
            this.players[player].money += sidepots[sidepot].pot / sidepotWinner.length; // Distribute pot equally among winners
            winningUsernames.push(this.players[player].username); // Add winner's username to the list
            winningStatement += this.players[player].username + ", "; // Update winning statement
          }
        }
      }
    }

    // Notify all players of the round results
    for (let player in this.players) {
      this.players[player].socket.emit('roundOver2', {
        winners: winningUsernames, // List of winners
        winningStatement: this.players[player].playing ? winningStatement : "You did not play this round", // Winning statement
        username: this.players[player].username, // Current player's username
        handRank: _handEvaluation.handEvaluation(
          this.players[player].hand, 
          this.players[player].playerNum, 
          this.players[player].username
        ).name
      });
      this.players[player].lastAction = ""; // Reset last action for the player
    }

    // Update player list for all players
    for (let player in this.players) {
      this.players[player].socket.emit('updatePlayerList', this.getPlayers(), this.players[player].playerNum);
      this.players[player].playing = null; // Reset playing status
    }

    // Notify players of the end of the round
    this.io.to(this.roomID).emit('optChoices', 'balls'); // Notify players to make choices
    this.io.to(this.roomID).emit("nextCards", ''); // Clear next cards display
    this.io.to(this.roomID).emit('updatePot', 0); // Reset pot
    this.gameStarted = false; // End the game
  } catch (error) {
    // Log error if ending round fails
    console.error("Error ending round:", error.message);
  }
}

  // Method to outline indicating the current player's turn
  updateOutline(i) {
    try {
      for (let player in this.players) {
        this.players[player].socket.emit("moveArrow", i, this.players[player].playerNum); // Notify players of the current turn
      }
    } catch (error) {
      // Log error if updating arrow fails
      console.error("Error updating arrow:", error.message);
    }
  }

  // Method to get the current state of players
  getPlayers() {
    try {
      var gotPlayers = []; // Array to hold player information
      for (let player in this.players) {
        gotPlayers.push({
          playerNum: this.players[player].playerNum, // Player number
          username: this.players[player].username, // Player username
          money: this.players[player].money, // Player's current money
          folded: this.players[player].folded, // Fold status
          playing: this.players[player].playing, // Playing status
          bet: this.players[player].bet, // Current bet
          roundBet: this.players[player].roundBet, // Round bet
          lastAction: this.players[player].lastAction // Last action taken by the player
        });
      }
      return gotPlayers; // Return the list of players
    } catch (error) {
      // Log error if getting players fails
      console.error("Error getting players:", error.message);
    }
  }
}

// Export the PokerGame
module.exports = PokerGame;
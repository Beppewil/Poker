// Import required modules
const PokerGame = require('./server/pokerClass.js');
const profanity = require('@2toad/profanity').profanity;
const express = require("express");
const app = express();
const port = 25565;

// Set up socket.io
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const { v4: uuidV4 } = require('uuid');

// Initialize variables to store lobby information
var lobbiesIDs = [];
var lobbiesNumber = [];
var lobbies = {};
var LOBBY_ID = '';

// Set up Express.js
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static("views"));

// Serve static files from the 'views' directory
app.use('/views', express.static('views', {
  setHeaders: (res, path) => {
    // Set the Content-Type header for CSS files
    if (path.endsWith('.css')) {
      res.set("Content-Type", "text/css");
    }
  }
}));

// Handle GET request to the root URL
app.get("/", function (req, res) {
  // Check if the user is accessing the site from a mobile device
  if (req.headers['user-agent'].match(/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i) !== null) {
    // Render the mobile version of the site
    res.render("mobile", { mobile: true });
  } else {
    // Render the home page with a list of available lobbies
    res.render(`home`, { lobbiesIDs })
  }
});

// Handle GET request to a specific blackjack room
app.get('/blackjack/:room', function (req, res) {
  // Render the blackjack page with the room ID
  res.render('blackjack', { room: req.params.room })
})

// Handle POST request to join a lobby
app.post('/', (req, res) => {
  // Get the lobby ID from the hidden input field
  const lobbyId = req.body.lobbyId;
  // Redirect the user to the lobby page
  res.redirect(`/poker/${lobbiesNumber[lobbyId]}`)
});

// Handle POST request to create a new lobby
app.post("/createLobby", function (req, res) {
  // Generate a unique ID for the lobby
  LOBBY_ID = uuidV4();

  // Add the lobby to the list of available lobbies
  lobbiesIDs.push({ id: lobbiesIDs.length, name: req.body.gameName, blind: req.body.blindValue, players: 0, private: req.body.privateCheckbox == 'true' })
  lobbiesNumber.push(LOBBY_ID)

  // Create a new PokerGame instance for the lobby
  if (!lobbies[LOBBY_ID]) {
    if (req.body.privateCheckbox == 'true') {
      lobbies[LOBBY_ID] = new PokerGame(io, LOBBY_ID, Math.floor(Math.abs(req.body.blindValue)), req.body.gamePassword, lobbiesNumber.length - 1);
    } else {
      lobbies[LOBBY_ID] = new PokerGame(io, LOBBY_ID, Math.floor(Math.abs(req.body.blindValue)), null, lobbiesNumber.length - 1);
    }
  }

  // Emit a 'newButton' event to update the lobby list
  io.emit('newButton', lobbiesIDs, req.body.gameName);

  // Redirect the user to the lobby page
  res.redirect(`/poker/${LOBBY_ID}`)
});

// Handle GET request to a specific poker room
app.get('/poker/:room', function (req, res) {
  // Render the poker page with the room ID
  res.render('poker', { room: req.params.room })
})

// Set up socket.io event listeners
io.on("connection", (socket) => {

  // Handle 'joinPrivateLobby' event
  socket.on('joinPrivateLobby', (lobbyNum, password) => {
    // Check if the password is correct
    if (lobbies[lobbiesNumber[lobbyNum]].password == password) {
      // Emit a 'joinAttempt' event with the room ID
      socket.emit('joinAttempt', lobbies[lobbiesNumber[lobbyNum]].roomID)
    } else {
      // Emit a 'joinAttempt' event with a null room ID
      socket.emit('joinAttempt', null)
    }
  })

  // Handle 'joinRoom' event
  socket.on('joinRoom', (roomId) => {
    // Check if the room exists
    if (!lobbies[roomId]) {
      // Emit 'leaveRoom' if it doesn't
      socket.emit('leaveRoom', "Room Doesnt Exist")
    } else {
      // Check if the room is full
      if (lobbies[roomId].NoOfPlayers < 8) {
        // Add the user to the room
        socket.data.room = roomId; // Store room on the socket
        socket.join(roomId);

        // Add the user to the game
        lobbies[roomId].addPlayer(socket, 'Player', 1000);

        // Update the lobby list
        const lobbyIndex = lobbiesNumber.indexOf(roomId)
        if (lobbyIndex !== -1) {
          lobbiesIDs[lobbyIndex].players++;
        }

        // Emit an 'updatePlayerList' event to update the player list
        for (let p in lobbies[socket.data.room].players) {
          lobbies[roomId].players[p].socket.emit('updatePlayerList', lobbies[roomId].getPlayers(), lobbies[roomId].players[p].playerNum)
        }

        // Emit an 'optChoices' event to prompt the user to make a choice
        if (lobbies[roomId].gameStarted == false) {
          socket.emit('optChoices', 'cards');
        }

        // Emit a 'playerJoin' event to confirm the user's join
        socket.emit('playerJoin', '');

        // Notify other users in the room about the new user (for WebRTC)
        socket.to(roomId).emit("new-user", socket.id);
      } else {
        // Emit a 'leaveRoom' event with an error message
        socket.emit('leaveRoom', "Room Full")
      }
    }
  });

  // WebRTC Voice Chat Events
  socket.on("offer", (id, offer) => {
    io.to(id).emit("offer", socket.id, offer);
  });

  socket.on("answer", (id, answer) => {
    io.to(id).emit("answer", socket.id, answer);
  });

  socket.on("ice-candidate", (id, candidate) => {
    io.to(id).emit("ice-candidate", socket.id, candidate);
  });

  // Handle 'usernameEntered' event
  socket.on('usernameEntered', (username) => {
    // Check if the username is available and does not contain profanity
    if (lobbies[socket.data.room] != null) {
      if (lobbies[socket.data.room].playerList.filter(player => player.n == username).length == 0 && !profanity.exists(username)) {
        // Update the player's username
        const playerIndex = lobbies[socket.data.room].playerList.findIndex(player => player.p == lobbies[socket.data.room].players[socket.id].playerNum);
        lobbies[socket.data.room].playerList[playerIndex].n = username;
        lobbies[socket.data.room].players[socket.id].username = username;

        // Emit an 'updatePlayerList' event to update the player list
        for (let p in lobbies[socket.data.room].players) {
          lobbies[socket.data.room].players[p].socket.emit('updatePlayerList', lobbies[socket.data.room].getPlayers(), lobbies[socket.data.room].players[p].playerNum)
        }
      } else {
        // Emit a 'playerJoin' event with an error message
        socket.emit('playerJoin', 'Sorry Username Is Taken or Contains Profanity ')
      }
    }
  })

  // Handle 'playerKick' event
  socket.on('playerKick', (player) => {
    // Check if the user has permission to kick the player
    var kicked = false;
    if (socket.data.room != null) { // If the lobby exists
      if (lobbies[socket.data.room].players[socket.id].playerNum == 1) { // Check the kicking player is the host
        // Find the player to kick and remove them from the game
        for (let p in lobbies[socket.data.room].players) {
          if (lobbies[socket.data.room].players[p].playerNum == player && kicked == false) {
            lobbies[socket.data.room].players[p].socket.emit('leaveRoom', 'You Have Been Kicked') // Tell the user they have been kicked
            lobbies[socket.data.room].removePlayer(p, lobbies[socket.data.room].i); // Remove the player from the game
            kicked = true; // Set kicked to true
            return; // Break out the loop
          }
        }
      }
    }
  })

  // Handle 'optIN' event
  socket.on('optIN', (vote) => {
    // Check if the game is active
    if (lobbies[socket.data.room]) {
      // Update the player's vote
      lobbies[socket.data.room].playerOptIn(socket.id, vote);
    }
  })

  // Handle 'leaveRoom' event
  socket.on('leaveRoom', () => {
    // Check if the user is in a room
    if (lobbies[socket.data.room]) {
      // Remove the user from the room
      socket.leave(socket.data.room);
      lobbies[socket.data.room].removePlayer(socket.id, lobbies[socket.data.room].i);

      // Update the lobby list
      const lobbyIndex = lobbies[socket.data.room].lobbyNum;
      if (lobbyIndex != -1) {
        lobbiesIDs[lobbyIndex].players--;
      }

      // Emit an 'updatePlayerList' event to update the player list
      for (let p in lobbies[socket.data.room].players) {
        lobbies[socket.data.room].players[p ].socket.emit('updatePlayerList', lobbies[socket.data.room].getPlayers(), lobbies[socket.data.room].players[p].playerNum)
      }

      // Notify other users about disconnection (for WebRTC)
      socket.broadcast.emit("user-disconnected", socket.id);

      // Reset the user's room data
      socket.data.room = null;
    }
  })

  // Handle 'disconnect' event
  socket.on("disconnect", (reason) => {
    // Check if the user is in a room
    console.log(`${socket.id} disconnected (${reason})`);
    if (socket.data.room != null) {
      // Remove the user from the room
      lobbies[socket.data.room].removePlayer(socket.id, lobbies[socket.data.room].i);
      socket.leave(socket.data.room); // Leave the room on disconnect

      // Update the lobby list
      const lobbyIndex = lobbies[socket.data.room].lobbyNum;
      if (lobbyIndex != -1) {
        lobbiesIDs[lobbyIndex].players--;
      }

      // Reset the user's room data
      socket.data.room = null;

      socket.emit('leaveRoom', 'Timed Out')
    }

    // Notify other users about disconnection (for WebRTC)
    socket.broadcast.emit("user-disconnected", socket.id);
  });

  // Handle 'chat message' event
  socket.on("chat message", (msg) => {
    // Check if the user is in a room
    if (lobbies[socket.data.room]) {
      // Emit a 'chat message' event to all users in the room
      io.to(socket.data.room).emit("chat message", [lobbies[socket.data.room].players[socket.id].username, profanity.censor(msg)]);
    }
  });

  // Handle 'playerBet' event
  socket.on("playerBet", (betType) => {
    // Check if the user is in a room
    if (lobbies[socket.data.room]) {
      // Update the player's bet
      lobbies[socket.data.room].playerBet(socket.id, betType[0], betType[1]);
    }
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
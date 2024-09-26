const PokerGame = require('./server/pokerClass.js');

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

const lobbiesIDs = [];
const lobbiesNumber = [];
const lobbies = {};
var LOBBY_ID = '';

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static("views"));

app.use('/views', express.static('views', {
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.set("Content-Type", "text/css");
    }
  }
})); //Blackjack/:room doesnt work without this

app.get("/", function (req, res) {
  if (req.headers['user-agent'].match(/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i) !== null) {res.render("mobile", {mobile: true});}
  else {
    res.render(`home`, { lobbiesIDs })
  }
});

app.get('/blackjack/:room', function (req, res) {
  res.render('blackjack', { room: req.params.room })
})

app.post('/', (req, res) => {
  const lobbyId = req.body.lobbyId; // Get the lobby ID from the hidden input field

  console.log(lobbies)
  res.redirect(`/${lobbies[lobbiesNumber[lobbyId]].roomID}`)
});

app.post("/createLobby", function (req, res) {
  LOBBY_ID = uuidV4();
  lobbiesIDs.push({id: lobbiesIDs.length, name: req.body.gameName, blind: req.body.blindValue, players: 0, private: req.body.privateCheckbox == 'true' })
  lobbiesNumber.push(LOBBY_ID)
  // If no game exists for this room, create a new one
  if (!lobbies[LOBBY_ID]) {
    if(req.body.privateCheckbox == 'true') {lobbies[LOBBY_ID] = new PokerGame(io, LOBBY_ID, Math.floor(req.body.blindValue), req.body.gamePassword, lobbiesNumber.length - 1);}
    else {lobbies[LOBBY_ID] = new PokerGame(io, LOBBY_ID, Math.floor(req.body.blindValue), null, lobbiesNumber.length - 1);}
  }
  io.emit('newButton', lobbiesIDs, req.body.gameName);
  res.redirect(`/${LOBBY_ID}`)
});

app.get("/:room", function (req, res) {
  res.render("poker", {room: req.params.room});
})



io.on("connection", (socket) => {

  socket.on('joinPrivateLobby', (lobbyNum, password) => {
    if (lobbies[lobbiesNumber[lobbyNum]].password == password) {socket.emit('joinAttempt', lobbies[lobbiesNumber[lobbyNum]].roomID)}
    else {socket.emit('joinAttempt', null)}
  })
  

  socket.on('joinRoom', (roomId) => {    
    if (!lobbies[roomId]) {
    socket.emit('leaveRoom', "Room Doesnt Exist")
    } else {

    if (lobbies[roomId].NoOfPlayers < 8) {
    
      console.log(`User joined room ${roomId}`);
      socket.data.room = roomId; // Store room on the socket
      socket.join(roomId);
  
      lobbies[roomId].addPlayer(socket, 'Player', 1000);
        
      const lobbyIndex = lobbiesNumber.indexOf(roomId)
      if (lobbyIndex !== -1) {
        lobbiesIDs[lobbyIndex].players++;
      }
      for (let p in lobbies[socket.data.room].players) { 
        lobbies[roomId].players[p].socket.emit('updatePlayerList', lobbies[roomId].getPlayers(), lobbies[roomId].players[p].playerNum)
      }
  
      if (lobbies[roomId].gameStarted == false) {socket.emit('optChoices', 'cards');}
      
  
      socket.emit('playerJoin', '');
      } else {socket.emit('leaveRoom', "Room Full")}
    }
  });
  //Joining and leaving
  console.log("a user connected");

  
  
  socket.on('usernameEntered', (username) => {
    if (lobbies[socket.data.room] != null) {
    if (lobbies[socket.data.room].playerList.filter(player => player.n == username).length == 0 && !profanity.exists(username)) {
      const playerIndex = lobbies[socket.data.room].playerList.findIndex(player => player.p == lobbies[socket.data.room].players[socket.id].playerNum);
      lobbies[socket.data.room].playerList[playerIndex].n = username;
        lobbies[socket.data.room].players[socket.id].username = username;

      for (let p in lobbies[socket.data.room].players) { 
        lobbies[socket.data.room].players[p].socket.emit('updatePlayerList', lobbies[socket.data.room].getPlayers(), lobbies[socket.data.room].players[p].playerNum)
      }
    } else (socket.emit('playerJoin', 'Sorry Username Is Taken or Contains Profanity '))
    }
  })

  socket.on('playerKick', (player) => {
    var kicked = false;
    if (socket.data.room != null) {
      if (lobbies[socket.data.room].players[socket.id].playerNum == 1) {
        for (let p in lobbies[socket.data.room].players) {
          if(lobbies[socket.data.room].players[p].playerNum == player && kicked == false) {
            lobbies[socket.data.room].players[p].socket.emit('leaveRoom', 'You Have Been Kicked')
            lobbies[socket.data.room].removePlayer(p, lobbies[socket.data.room].i);
            kicked = true;
          }
        }
      }
    }
  })

  socket.on('optIN', (vote) => {
    if (lobbies[socket.data.room]) {
      lobbies[socket.data.room].playerOptIn(socket.id, vote);
    }
  })

  socket.on('leaveRoom', () => {
    if (lobbies[socket.data.room]) {
      console.log(`User left room ${socket.data.room}`);
      socket.leave(socket.data.room);
      lobbies[socket.data.room].removePlayer(socket.id, lobbies[socket.data.room].i);
      for (let p in lobbies[socket.data.room].players) { 
        lobbies[socket.data.room].players[p].socket.emit('updatePlayerList', lobbies[socket.data.room].getPlayers(), lobbies[socket.data.room].players[p].playerNum)
      }
      const lobbyIndex = lobbies[socket.data.room].lobbyNum;
      console.log(lobbyIndex)
      if (lobbyIndex != -1) {
        lobbiesIDs[lobbyIndex].players--;
      }
      socket.data.room = null;
    }
  })

  socket.on("disconnect", (reason) => {
    console.log(`${socket.id} disconnected (${reason})`);
    if (socket.data.room != null) {
      lobbies[socket.data.room].removePlayer(socket.id, lobbies[socket.data.room].i);
      socket.leave(socket.data.room); // Leave the room on disconnect
      const lobbyIndex = lobbies[socket.data.room].lobbyNum;
      console.log(lobbyIndex)
      if (lobbyIndex != -1) {
        lobbiesIDs[lobbyIndex].players--;
      }
      socket.data.room = null;
    }
  });

  //Chat
  socket.on("chat message", (msg) => {
    if (lobbies[socket.data.room]) {
      io.to(socket.data.room).emit("chat message", [lobbies[socket.data.room].players[socket.id].username, profanity.censor(msg)]);
    }
  });

  //Player Betting
  socket.on("playerBet", (betType) => {
    if (lobbies[socket.data.room]) {
      lobbies[socket.data.room].playerBet(socket.id, betType[0], betType[1]);
    }
  });
});

server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
// Get references to DOM elements
var blurer = document.getElementById("blurer"); // Blur effect for the main screen
var settingsBlurer = document.getElementById('settingsBlurer'); // Blur effect for settings
var menuBTN = document.getElementById('menuBTN'); // Menu button
var chatBTN = document.getElementById('chat-btn'); // Chat button
var optionsBTN = document.getElementById('optionsBTN'); // Options button
const leaveBTN = document.getElementById('leaveBTN'); // Leave button
var blackTriangle = document.getElementById("black-triangle"); // Triangle icon for menu
var playerOptionsBTN = document.getElementById("playerOptions"); // Player options button
var gameTimer = document.getElementById('gameTimer'); // Game timer display
var muteBTN = document.getElementById('mute') // Voice Chat mute button
const deafenBTN = document.getElementById('deafenBTN');

// Import the socket connection - Changed to absolute path
import { socket } from '/views/socket.js';

// WebRTC Voice Chat Variables
let localStream;
let isMuted = true;
let peers = {};

// Add hover effects to the black triangle (menu icon)
blackTriangle.addEventListener('mouseover', function () {
  menuBTN.classList.add('hover'); // Add hover class to menu button
});
blackTriangle.addEventListener('mouseout', function () {
  menuBTN.classList.remove('hover'); // Remove hover class from menu button
});

// Add click event listeners for menu and player options
blackTriangle.addEventListener('click', menuPress);
menuBTN.addEventListener('click', menuPress);
playerOptionsBTN.addEventListener('click', playerOptions);

// Function to toggle the menu
function menuPress() {
  document.getElementById("wrapper").classList.toggle("show"); // Toggle the menu visibility
  blackTriangle.classList.toggle("rotate90"); // Rotate the triangle icon
}

// Add click event listener for the options button
optionsBTN.addEventListener('click', options);

// Function to toggle the options menu
function options() {
  document.getElementById("wrapper").classList.toggle("show"); // Toggle the menu visibility
  settingsBlurer.classList.toggle("active"); // Toggle the settings blur effect
  blackTriangle.classList.toggle("rotate90"); // Rotate the triangle icon
  playerOptionsBTN.classList.toggle("active"); // Toggle the player options button
  for (var i = 0; i < 8; i++) {
    document.getElementById(`player${i + 1}options`).classList.remove('active'); // Hide all player options
  }
}

// Add click event listener for the leave button
leaveBTN.addEventListener('click', leave);

// Function to handle leaving the room
function leave() {
  socket.emit('leaveRoom', true); // Emit 'leaveRoom' event to the server
}

// Function to toggle player options
function playerOptions() {
  for (var i = 0; i < 8; i++) {
    if (document.getElementById(`player${i + 1}options`).innerHTML.length > 0) {
      document.getElementById(`player${i + 1}options`).classList.toggle('active'); // Toggle player options visibility
    }
  }
}

// Add click event listeners for kicking players
document.getElementById('player1options').addEventListener('click', playerKick1);
document.getElementById('player2options').addEventListener('click', playerKick2);
document.getElementById('player3options').addEventListener('click', playerKick3);
document.getElementById('player4options').addEventListener('click', playerKick4);
document.getElementById('player5options').addEventListener('click', playerKick5);
document.getElementById('player6options').addEventListener('click', playerKick6);
document.getElementById('player7options').addEventListener('click', playerKick7);
document.getElementById('player8options').addEventListener('click', playerKick8);

// Functions to kick specific players
function playerKick1() { socket.emit('playerKick', 1); }
function playerKick2() { socket.emit('playerKick', 2); }
function playerKick3() { socket.emit('playerKick', 3); }
function playerKick4() { socket.emit('playerKick', 4); }
function playerKick5() { socket.emit('playerKick', 5); }
function playerKick6() { socket.emit('playerKick', 6); }
function playerKick7() { socket.emit('playerKick', 7); }
function playerKick8() { socket.emit('playerKick', 8); }

// Socket event: Update the player list
socket.on('updatePlayerList', (playerList, playerNumber) => {
  console.log(playerList);
  // Reset all player options and UI elements
  for (var i = 0; i < 8; i++) {
    document.getElementById(`player${i + 1}options`).innerHTML = '';
    document.getElementById(`player${i + 1}options`).classList.remove('active');
    document.getElementById(`player${i + 1}`).classList.remove("active");
    if (i > 1 && i < 8) {
      document.getElementById(`player${i}Card1`).classList.remove('active');
      document.getElementById(`player${i}Card2`).classList.remove('active');
    }
  }
  // Update the UI with the current player list
  playerList.forEach(player => {
    document.getElementById(`player${player.playerNum}`).classList.add("active");
    document.getElementById(`player${player.playerNum}options`).innerHTML = player.username;
    document.getElementById(`player${player.playerNum}Card1`).classList.add('active');
    document.getElementById(`player${player.playerNum}Card2`).classList.add('active');
  });
  // Update player names, money, and last actions based on their position
  if (playerNumber !== 1) {
    playerList.forEach(player => {
      if (player.playerNum === playerNumber) {
        document.getElementById(`player1Name`).innerHTML = player.username;
        document.getElementById(`player1Money`).innerHTML = player.money;
        document.getElementById(`player1LastAction`).innerHTML = player.lastAction;
      } else {
        if (player.playerNum < playerNumber) {
          document.getElementById(`player${player.playerNum + 1}Name`).innerHTML = player.username;
          document.getElementById(`player${player.playerNum + 1}Money`).innerHTML = player.money;
          document.getElementById(`player${player.playerNum + 1}LastAction`).innerHTML = player.lastAction;
        } else {
          document.getElementById(`player${player.playerNum}Name`).innerHTML = player.username;
          document.getElementById(`player${player.playerNum}Money`).innerHTML = player.money;
          document.getElementById(`player${player.playerNum}LastAction`).innerHTML = player.lastAction;
        }
      }
    });
  } else {
    playerList.forEach(player => {
      if (player.playerNum === playerNumber) {
        document.getElementById(`player1Name`).innerHTML = player.username;
        document.getElementById(`player1Money`).innerHTML = player.money;
        document.getElementById(`player1LastAction`).innerHTML = player.lastAction;
      } else {
        document.getElementById(`player${player.playerNum}Name`).innerHTML = player.username;
        document.getElementById(`player${player.playerNum}Money`).innerHTML = player.money;
        document.getElementById(`player${player.playerNum}LastAction`).innerHTML = player.lastAction;
      }
    });
  }
});

// Chat functionality
var chatSend = document.getElementById('chat-send'); // Chat send button
var input = document.getElementById('input'); // Chat input field
var messages = document.getElementById('messages'); // Chat messages container
var chatWindow = document.getElementById("chat-window"); // Chat window

// Add click event listeners for chat
chatBTN.addEventListener('click', toggleChat);
chatSend.addEventListener('click', sendChat);

// Function to toggle the chat window
function toggleChat() {
  chatWindow.classList.toggle("active");
}

// Add keydown event listener for chat input
input.addEventListener('keydown', function (e) {
  if (e.key == 'Enter') {
    e.preventDefault();
    sendChat(); // Send chat message on Enter key
  }
});

// Socket event: Receive chat messages
socket.on('chat message', function (msg) {
  var item = document.createElement('li'); // Create a new list item for the message
  item.textContent = msg[0] + ": " + msg[1]; // Add the message content
  messages.appendChild(item); // Append the message to the chat window
  messages.scrollTo(0, messages.scrollHeight); // Scroll to the bottom of the chat
});

// Function to send a chat message
function sendChat() {
  if (input.value) {
    socket.emit('chat message', input.value); // Emit the chat message to the server
    input.value = ''; // Clear the input field
  }
}

// Socket event: Update the game timer
socket.on('updateTimer', (timeLeft, over) => {
  if (!over) {
    gameTimer.classList.add('active');
    gameTimer.innerHTML = "Round Starts In: " + timeLeft; // Update the timer display
  } else {
    gameTimer.classList.remove('active'); // Hide the timer when the round is over
  }
});

// Socket event: Handle leaving the room
socket.on('leaveRoom', (msg) => {
  alert(msg); // Show a message when leaving the room
  window.location.href = '/'; // Redirect to the home page
});

// WebRTC Voice Chat Functions - Mobile Compatible
let remoteAudioElements = {}; // Store remote audio elements
let isDeafened = true;

function createPeer(id) {
  const peer = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });
 
  peer.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("ice-candidate", id, event.candidate);
    }
  };
 
  peer.ontrack = event => {
    console.log('Received remote track from:', id);
    
    // Create audio element and add to DOM
    const remoteAudio = document.createElement('audio');
    remoteAudio.id = `remote-audio-${id}`;
    remoteAudio.srcObject = event.streams[0];
    remoteAudio.autoplay = true;
    remoteAudio.playsInline = true; // Important for iOS
    remoteAudio.muted = isDeafened;
    
    // Add to DOM (hidden)
    remoteAudio.style.display = 'none';
    document.body.appendChild(remoteAudio);
    
    // Store the audio element for this peer
    remoteAudioElements[id] = remoteAudio;
    
    // Handle mobile autoplay restrictions
    const playAudio = async () => {
      try {
        await remoteAudio.play();
        console.log('Remote audio playing for:', id);
      } catch (error) {
        console.warn('Autoplay failed for remote audio:', error);
        // On mobile, audio will play after user interaction
      }
    };
    
    // Try to play immediately
    playAudio();
    
    // Also try to play on next user interaction
    const enableAudioOnInteraction = () => {
      playAudio();
      document.removeEventListener('touchstart', enableAudioOnInteraction);
      document.removeEventListener('click', enableAudioOnInteraction);
    };
    
    document.addEventListener('touchstart', enableAudioOnInteraction, { once: true });
    document.addEventListener('click', enableAudioOnInteraction, { once: true });
  };
 
  peer.onnegotiationneeded = async () => {
    try {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit("offer", id, peer.localDescription);
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };
 
  return peer;
}

// WebRTC Socket Events
socket.on('connect', () => {
  console.log('Socket connected, initializing WebRTC...');
  
  // Request audio with mobile-optimized constraints
  const audioConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      // Mobile-specific optimizations
      sampleRate: 16000,
      channelCount: 1
    }, 
    video: false
  };
  
  navigator.mediaDevices.getUserMedia(audioConstraints)
    .then(stream => {
      localStream = stream;
      console.log('Local audio stream obtained');
     
      socket.on("new-user", id => {
        console.log('New user connected:', id);
        const peer = createPeer(id);
        peers[id] = peer;
        stream.getTracks().forEach(track => {
          console.log('Adding local track to peer:', id);
          peer.addTrack(track, stream);
        });
      });
     
      socket.on("offer", async (id, offer) => {
        console.log('Received offer from:', id);
        try {
          const peer = createPeer(id);
          peers[id] = peer;
          await peer.setRemoteDescription(new RTCSessionDescription(offer));
          stream.getTracks().forEach(track => peer.addTrack(track, stream));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit("answer", id, answer);
          console.log('Sent answer to:', id);
        } catch (error) {
          console.error('Error handling offer:', error);
        }
      });
     
      socket.on("answer", async (id, answer) => {
        console.log('Received answer from:', id);
        try {
          await peers[id]?.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
          console.error('Error handling answer:', error);
        }
      });
     
      socket.on("ice-candidate", async (id, candidate) => {
        console.log('Received ICE candidate from:', id);
        try {
          if (peers[id]) {
            await peers[id].addIceCandidate(new RTCIceCandidate(candidate));
          }
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      });
     
      socket.on("user-disconnected", id => {
        console.log('User disconnected:', id);
        if (peers[id]) {
          peers[id].close();
          delete peers[id];
        }
        // Clean up remote audio element
        if (remoteAudioElements[id]) {
          const audioElement = remoteAudioElements[id];
          if (audioElement.parentNode) {
            audioElement.parentNode.removeChild(audioElement);
          }
          delete remoteAudioElements[id];
        }
      });
    })
    .catch(error => {
      console.error('Error accessing microphone:', error);
      alert('Microphone access denied. Voice chat will not work.');
    });
});

// Mute/Unmute functionality
muteBTN.addEventListener('click', toggleMute);
function toggleMute() {
  if (localStream) {
    isMuted = !isMuted;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !isMuted;
      console.log(isMuted ? "Muted" : "Unmuted");
      muteBTN.innerHTML = isMuted ? "Unmute" : "Mute";
    }
    return isMuted;
  }
}

// Deafen/Undeafen functionality
deafenBTN.addEventListener('click', toggleDeafen);
function toggleDeafen() {
  isDeafened = !isDeafened;
  
  // Don't automatically mute when deafening - let user control separately
  // isMuted = !isMuted; // Remove this line
 
  // Apply deafen state to all current remote audio elements
  Object.values(remoteAudioElements).forEach(audioElement => {
    audioElement.muted = isDeafened;
    console.log(`Set remote audio muted to: ${isDeafened}`);
  });
 
  console.log('Remote audio elements:', remoteAudioElements);
  console.log(isDeafened ? "Deafened" : "Undeafened");
  deafenBTN.innerHTML = isDeafened ? "Undeafen" : "Deafen";
  
  return isDeafened;
}

// Add this button click handler
document.getElementById('startVoiceBtn').addEventListener('click', () => {
  enableAllAudio();
  // Hide the button after first interaction
  document.getElementById('startVoiceBtn').style.display = 'none';
});

// Add a function to manually enable audio (call this on user interaction)
function enableAllAudio() {
  Object.values(remoteAudioElements).forEach(async audioElement => {
    try {
      await audioElement.play();
      console.log('Successfully started remote audio playback');
    } catch (error) {
      console.warn('Could not start audio playback:', error);
    }
  });
}

// Export functions for global access
window.toggleMute = toggleMute;
window.toggleDeafen = toggleDeafen;
window.enableAllAudio = enableAllAudio;
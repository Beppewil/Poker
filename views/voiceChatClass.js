// Enhanced WebRTC Voice Chat Implementation
class VoiceChat {
  constructor(socket) {
    this.socket = socket;
    this.localStream = null;
    this.peers = {};
    this.isMuted = false;
    this.isDeafened = false;
    this.iceServers = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      // Add TURN servers for better connectivity
      {
        urls: "turn:your-turn-server.com:3478",
        username: "username",
        credential: "password"
      }
    ];
    this.audioContext = null;
    this.audioNodes = {};
    this.connectionStates = {};
    this.reconnectAttempts = {};
    this.maxReconnectAttempts = 3;
    
    this.initialiseVoiceChat();
    this.setupSocketListeners();
  }

  async initialiseVoiceChat() {
    try {
      // Request microphone access with better error handling
      this.localStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }, 
        video: false 
      });
      
      // initialise Web Audio API for volume control
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      console.log("Voice chat initialised successfully");
      this.emit('voiceChatReady');
    } catch (error) {
      console.error('Error initializing voice chat:', error);
      this.handleMicrophoneError(error);
    }
  }

  setupSocketListeners() {
    this.socket.on("new-user", (id) => {
      console.log("New user joined:", id);
      this.createPeerConnection(id, true);
    });

    this.socket.on("offer", async (id, offer) => {
      console.log("Received offer from:", id);
      await this.handleOffer(id, offer);
    });

    this.socket.on("answer", async (id, answer) => {
      console.log("Received answer from:", id);
      await this.handleAnswer(id, answer);
    });

    this.socket.on("ice-candidate", async (id, candidate) => {
      console.log("Received ICE candidate from:", id);
      await this.handleIceCandidate(id, candidate);
    });

    this.socket.on("user-disconnected", (id) => {
      console.log("User disconnected:", id);
      this.removePeer(id);
    });
  }

  createPeerConnection(id, isInitiator = false) {
    if (this.peers[id]) {
      console.log("Peer connection already exists for:", id);
      return this.peers[id];
    }

    const peer = new RTCPeerConnection({
      iceServers: this.iceServers,
      iceCandidatePoolSize: 10
    });

    // Enhanced connection state monitoring
    peer.onconnectionstatechange = () => {
      console.log(`Connection state for ${id}:`, peer.connectionState);
      this.connectionStates[id] = peer.connectionState;
      
      if (peer.connectionState === 'failed') {
        this.handleConnectionFailure(id);
      }
    };

    peer.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for ${id}:`, peer.iceConnectionState);
      
      if (peer.iceConnectionState === 'failed') {
        this.handleConnectionFailure(id);
      }
    };

    peer.onicecandidate = event => {
      if (event.candidate) {
        this.socket.emit("ice-candidate", id, event.candidate);
      }
    };

    peer.ontrack = event => {
      console.log("Received track from:", id);
      this.handleIncomingTrack(id, event.streams[0]);
    };

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peer.addTrack(track, this.localStream);
      });
    }

    this.peers[id] = peer;
    this.reconnectAttempts[id] = 0;

    // Create offer if we're the initiator
    if (isInitiator) {
      this.createOffer(id);
    }

    return peer;
  }

  async createOffer(id) {
    try {
      const peer = this.peers[id];
      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      
      await peer.setLocalDescription(offer);
      this.socket.emit("offer", id, offer);
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  }

  async handleOffer(id, offer) {
    try {
      const peer = this.createPeerConnection(id, false);
      
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      
      this.socket.emit("answer", id, answer);
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  }

  async handleAnswer(id, answer) {
    try {
      const peer = this.peers[id];
      if (peer) {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  }

  async handleIceCandidate(id, candidate) {
    try {
      const peer = this.peers[id];
      if (peer) {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
    }
  }

  handleIncomingTrack(id, stream) {
    // Create audio element for this user
    let audioElement = document.getElementById(`voice-${id}`);
    if (!audioElement) {
      audioElement = document.createElement('audio');
      audioElement.id = `voice-${id}`;
      audioElement.autoplay = true;
      audioElement.controls = false;
      audioElement.style.display = 'none';
      document.body.appendChild(audioElement);
    }

    audioElement.srcObject = stream;

    // Set up audio processing for volume control
    if (this.audioContext) {
      const source = this.audioContext.createMediaStreamSource(stream);
      const gainNode = this.audioContext.createGain();
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      this.audioNodes[id] = { source, gainNode };
    }

    // Resume audio context if suspended (Chrome policy)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  handleConnectionFailure(id) {
    console.log(`Connection failed for ${id}, attempting reconnect...`);
    
    if (this.reconnectAttempts[id] < this.maxReconnectAttempts) {
      this.reconnectAttempts[id]++;
      
      setTimeout(() => {
        this.removePeer(id);
        this.createPeerConnection(id, true);
      }, 1000 * this.reconnectAttempts[id]);
    } else {
      console.log(`Max reconnect attempts reached for ${id}`);
      this.removePeer(id);
    }
  }

  removePeer(id) {
    if (this.peers[id]) {
      this.peers[id].close();
      delete this.peers[id];
    }
    
    if (this.audioNodes[id]) {
      this.audioNodes[id].source.disconnect();
      this.audioNodes[id].gainNode.disconnect();
      delete this.audioNodes[id];
    }
    
    delete this.connectionStates[id];
    delete this.reconnectAttempts[id];
    
    const audioElement = document.getElementById(`voice-${id}`);
    if (audioElement) {
      audioElement.remove();
    }
  }

  // Enhanced mute/unmute with visual feedback
  toggleMute() {
    if (!this.localStream) return false;
    
    this.isMuted = !this.isMuted;
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = !this.isMuted;
    });
    
    console.log(this.isMuted ? "Muted" : "Unmuted");
    this.emit('muteStateChanged', this.isMuted);
    
    return this.isMuted;
  }

  // Deafen (mute incoming audio)
  toggleDeafen() {
    this.isDeafened = !this.isDeafened;
    
    Object.values(this.audioNodes).forEach(node => {
      if (node.gainNode) {
        node.gainNode.gain.value = this.isDeafened ? 0 : 1;
      }
    });
    
    console.log(this.isDeafened ? "Deafened" : "Undeafened");
    this.emit('deafenStateChanged', this.isDeafened);
    
    return this.isDeafened;
  }

  // Set volume for specific user
  setUserVolume(userId, volume) {
    if (this.audioNodes[userId] && this.audioNodes[userId].gainNode) {
      this.audioNodes[userId].gainNode.gain.value = volume;
    }
  }

  // Get connection quality info
  getConnectionStats(userId) {
    const peer = this.peers[userId];
    if (!peer) return null;
    
    return peer.getStats().then(stats => {
      let result = {};
      stats.forEach(report => {
        if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
          result.packetsLost = report.packetsLost;
          result.jitter = report.jitter;
          result.bytesReceived = report.bytesReceived;
        }
      });
      return result;
    });
  }

  handleMicrophoneError(error) {
    let message = "Voice chat unavailable: ";
    
    switch (error.name) {
      case 'NotAllowedError':
        message += "Microphone access denied. Please allow microphone access and refresh.";
        break;
      case 'NotFoundError':
        message += "No microphone found. Please connect a microphone.";
        break;
      case 'NotReadableError':
        message += "Microphone is being used by another application.";
        break;
      default:
        message += "Unable to access microphone.";
    }
    
    console.warn(message);
    this.emit('microphoneError', message);
  }

  // Event emitter functionality
  emit(event, data) {
    const customEvent = new CustomEvent(event, { detail: data });
    document.dispatchEvent(customEvent);
  }

  // Clean up resources
  destroy() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    
    Object.keys(this.peers).forEach(id => {
      this.removePeer(id);
    });
    
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// Usage example
const voiceChat = new VoiceChat(socket);

// Event listeners for UI updates
document.addEventListener('voiceChatReady', () => {
  console.log('Voice chat is ready!');
  document.getElementById('voice-status').textContent = 'Voice chat active';
});

document.addEventListener('muteStateChanged', (e) => {
  const muteButton = document.getElementById('mute-button');
  muteButton.textContent = e.detail ? 'Unmute' : 'Mute';
  muteButton.classList.toggle('muted', e.detail);
});

document.addEventListener('microphoneError', (e) => {
  document.getElementById('voice-status').textContent = e.detail;
});

// UI Controls
function toggleMute() {
  return voiceChat.toggleMute();
}

function toggleDeafen() {
  return voiceChat.toggleDeafen();
}

// Export for global access
window.voiceChat = voiceChat;
window.toggleMute = toggleMute;
window.toggleDeafen = toggleDeafen;
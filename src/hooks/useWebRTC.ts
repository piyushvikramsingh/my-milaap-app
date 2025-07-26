import { useEffect, useRef, useState, useCallback } from 'react';
import { socket } from '../services/socket';

interface WebRTCState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  isCameraOn: boolean;
  isMicOn: boolean;
}

export const useWebRTC = () => {
  const [state, setState] = useState<WebRTCState>({
    localStream: null,
    remoteStream: null,
    isConnected: false,
    isCameraOn: true,
    isMicOn: true,
  });

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // ICE servers (STUN servers for NAT traversal)
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ];

  // Initialize WebRTC
  const initializeWebRTC = useCallback(async () => {
    try {
      console.log('🎥 Initializing WebRTC and requesting camera/mic access...');
      
      // Get user media with optimized constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        },
      });

      console.log('✅ Got user media stream:', stream);
      console.log('📹 Video tracks:', stream.getVideoTracks().length);
      console.log('🎤 Audio tracks:', stream.getAudioTracks().length);
      
      // Update state with stream
      setState(prev => ({ 
        ...prev, 
        localStream: stream,
        isCameraOn: stream.getVideoTracks()[0]?.enabled || false,
        isMicOn: stream.getAudioTracks()[0]?.enabled || false
      }));

      // Set local video source immediately
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        
        // Ensure video plays
        localVideoRef.current.onloadedmetadata = () => {
          console.log('🎬 Local video metadata loaded, starting playback...');
          localVideoRef.current?.play().catch(err => {
            console.error('❌ Error playing local video:', err);
          });
        };

        // Force play after a short delay
        setTimeout(() => {
          if (localVideoRef.current && localVideoRef.current.paused) {
            console.log('🔄 Force playing local video...');
            localVideoRef.current.play().catch(console.error);
          }
        }, 200);
      }

      return stream;

    } catch (error) {
      console.error('❌ Error getting user media:', error);
      
      // Try audio only as fallback
      try {
        console.log('🔄 Trying audio-only fallback...');
        const audioStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        
        setState(prev => ({ 
          ...prev, 
          localStream: audioStream, 
          isCameraOn: false,
          isMicOn: true 
        }));
        
        return audioStream;
      } catch (audioError) {
        console.error('❌ Error getting audio:', audioError);
        alert('Please allow camera and microphone access to use this app');
        return null;
      }
    }
  }, []);

  // Setup peer connection
  const setupPeerConnection = useCallback((stream: MediaStream) => {
    console.log('🔗 Setting up peer connection...');
    
    // Create new peer connection
    peerConnection.current = new RTCPeerConnection({ iceServers });

    // Add all tracks to peer connection
    stream.getTracks().forEach(track => {
      if (peerConnection.current) {
        console.log(`➕ Adding ${track.kind} track to peer connection`);
        peerConnection.current.addTrack(track, stream);
      }
    });

    // Handle remote stream
    peerConnection.current.ontrack = (event) => {
      console.log('📺 Received remote track:', event.track.kind);
      const [remoteStream] = event.streams;
      
      setState(prev => ({ ...prev, remoteStream }));
      
      // Set remote video immediately
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        
        remoteVideoRef.current.onloadedmetadata = () => {
          console.log('🎬 Remote video metadata loaded, starting playback...');
          remoteVideoRef.current?.play().catch(console.error);
        };
        
        // Force play
        setTimeout(() => {
          if (remoteVideoRef.current && remoteVideoRef.current.paused) {
            remoteVideoRef.current.play().catch(console.error);
          }
        }, 200);
      }
    };

    // Handle ICE candidates
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 Sending ICE candidate');
        // We'll set the target in the specific methods
      }
    };

    // Handle connection state changes
    peerConnection.current.onconnectionstatechange = () => {
      if (peerConnection.current) {
        const connectionState = peerConnection.current.connectionState;
        console.log('📊 WebRTC Connection state:', connectionState);
        
        setState(prev => ({ 
          ...prev, 
          isConnected: connectionState === 'connected' 
        }));
        
        if (connectionState === 'failed' || connectionState === 'disconnected') {
          console.log('❌ WebRTC connection failed/disconnected');
          setState(prev => ({ ...prev, remoteStream: null }));
        }
      }
    };

    // Handle ICE connection state
    peerConnection.current.oniceconnectionstatechange = () => {
      if (peerConnection.current) {
        console.log('🧊 ICE Connection state:', peerConnection.current.iceConnectionState);
      }
    };

  }, []);

  // Update peer connection when local stream changes
  useEffect(() => {
    if (state.localStream) {
      setupPeerConnection(state.localStream);
    }
  }, [state.localStream, setupPeerConnection]);

  // Create offer (caller)
  const createOffer = useCallback(async (targetId: string) => {
    if (!peerConnection.current) {
      console.log('❌ No peer connection available for offer');
      return;
    }

    try {
      console.log('📞 Creating offer for:', targetId);
      
      const offer = await peerConnection.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      
      await peerConnection.current.setLocalDescription(offer);
      console.log('✅ Local description set');

      socket.emit('webrtc-offer', {
        offer,
        target: targetId,
      });
      
      console.log('📤 Offer sent to:', targetId);
    } catch (error) {
      console.error('❌ Error creating offer:', error);
    }
  }, []);

  // Create answer (callee)
  const createAnswer = useCallback(async (offer: RTCSessionDescriptionInit, senderId: string) => {
    if (!peerConnection.current) {
      console.log('❌ No peer connection available for answer');
      return;
    }

    try {
      console.log('📞 Creating answer for:', senderId);
      
      await peerConnection.current.setRemoteDescription(offer);
      console.log('✅ Remote description set');
      
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      console.log('✅ Local description set');

      socket.emit('webrtc-answer', {
        answer,
        target: senderId,
      });
      
      console.log('📤 Answer sent to:', senderId);
    } catch (error) {
      console.error('❌ Error creating answer:', error);
    }
  }, []);

  // Handle answer
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnection.current) return;

    try {
      console.log('📞 Handling answer');
      await peerConnection.current.setRemoteDescription(answer);
      console.log('✅ Remote description set from answer');
    } catch (error) {
      console.error('❌ Error handling answer:', error);
    }
  }, []);

  // Handle ICE candidate
  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    if (!peerConnection.current) return;

    try {
      console.log('🧊 Adding ICE candidate');
      await peerConnection.current.addIceCandidate(candidate);
      console.log('✅ ICE candidate added');
    } catch (error) {
      console.error('❌ Error handling ICE candidate:', error);
    }
  }, []);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    if (state.localStream) {
      const videoTrack = state.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setState(prev => ({ ...prev, isCameraOn: videoTrack.enabled }));
        console.log('📹 Camera toggled:', videoTrack.enabled ? 'ON' : 'OFF');
      }
    }
  }, [state.localStream]);

  // Toggle microphone
  const toggleMic = useCallback(() => {
    if (state.localStream) {
      const audioTrack = state.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setState(prev => ({ ...prev, isMicOn: audioTrack.enabled }));
        console.log('🎤 Microphone toggled:', audioTrack.enabled ? 'ON' : 'OFF');
      }
    }
  }, [state.localStream]);

  // Cleanup
  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up WebRTC');
    
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => {
        track.stop();
        console.log(`⏹️ Stopped ${track.kind} track`);
      });
    }
    
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setState({
      localStream: null,
      remoteStream: null,
      isConnected: false,
      isCameraOn: true,
      isMicOn: true,
    });
  }, [state.localStream]);

  // Socket event listeners
  useEffect(() => {
    const handleOffer = ({ offer, sender }: { offer: RTCSessionDescriptionInit, sender: string }) => {
      console.log('📨 Received offer from:', sender);
      createAnswer(offer, sender);
    };

    const handleAnswerEvent = ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      console.log('📨 Received answer');
      handleAnswer(answer);
    };

    const handleIceCandidateEvent = ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      console.log('📨 Received ICE candidate');
      handleIceCandidate(candidate);
    };

    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-answer', handleAnswerEvent);
    socket.on('webrtc-ice-candidate', handleIceCandidateEvent);

    return () => {
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-answer', handleAnswerEvent);
      socket.off('webrtc-ice-candidate', handleIceCandidateEvent);
    };
  }, [createAnswer, handleAnswer, handleIceCandidate]);

  return {
    ...state,
    localVideoRef,
    remoteVideoRef,
    initializeWebRTC,
    createOffer,
    toggleCamera,
    toggleMic,
    cleanup,
  };
};

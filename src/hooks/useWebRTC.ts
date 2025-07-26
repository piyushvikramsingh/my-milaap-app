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
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const currentTargetId = useRef<string | null>(null);

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
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

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
        localVideoRef.current.muted = true; // Prevent audio feedback
        localVideoRef.current.autoplay = true;
        localVideoRef.current.playsInline = true;
        
        // Ensure video plays
        const playVideo = () => {
          if (localVideoRef.current) {
            localVideoRef.current.play().catch(err => {
              console.error('❌ Error playing local video:', err);
              // Try again with user interaction
              setTimeout(() => {
                if (localVideoRef.current) {
                  localVideoRef.current.play().catch(console.error);
                }
              }, 1000);
            });
          }
        };

        localVideoRef.current.onloadedmetadata = () => {
          console.log('🎬 Local video metadata loaded, starting playback...');
          playVideo();
        };

        // Force play after a short delay
        setTimeout(playVideo, 200);
      }

      return stream;

    } catch (error) {
      console.error('❌ Error getting user media:', error);
      
      // Try different fallback strategies
      const fallbackStrategies = [
        // Strategy 1: Try with lower video quality
        {
          video: { width: 640, height: 480, frameRate: 15 },
          audio: { echoCancellation: true, noiseSuppression: true }
        },
        // Strategy 2: Try audio only
        {
          audio: { echoCancellation: true, noiseSuppression: true }
        },
        // Strategy 3: Try basic constraints
        {
          video: true,
          audio: true
        }
      ];

      for (const constraints of fallbackStrategies) {
        try {
          console.log('🔄 Trying fallback strategy:', constraints);
          const fallbackStream = await navigator.mediaDevices.getUserMedia(constraints);
          
          setState(prev => ({ 
            ...prev, 
            localStream: fallbackStream,
            isCameraOn: fallbackStream.getVideoTracks().length > 0,
            isMicOn: fallbackStream.getAudioTracks().length > 0
          }));

          if (localVideoRef.current && fallbackStream.getVideoTracks().length > 0) {
            localVideoRef.current.srcObject = fallbackStream;
            localVideoRef.current.muted = true;
            localVideoRef.current.autoplay = true;
            localVideoRef.current.playsInline = true;
            localVideoRef.current.play().catch(console.error);
          }
          
          return fallbackStream;
        } catch (fallbackError) {
          console.error('❌ Fallback strategy failed:', fallbackError);
        }
      }

      // If all strategies fail
      alert('Camera and microphone access are required. Please check your browser settings and permissions.');
      return null;
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
        remoteVideoRef.current.autoplay = true;
        remoteVideoRef.current.playsInline = true;
        
        const playRemoteVideo = () => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.play().catch(err => {
              console.error('❌ Error playing remote video:', err);
              // Try again
              setTimeout(() => {
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.play().catch(console.error);
                }
              }, 1000);
            });
          }
        };

        remoteVideoRef.current.onloadedmetadata = () => {
          console.log('🎬 Remote video metadata loaded, starting playback...');
          playRemoteVideo();
        };
        
        // Force play
        setTimeout(playRemoteVideo, 200);
      }
    };

    // Handle ICE candidates
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate && currentTargetId.current) {
        console.log('🧊 Sending ICE candidate to:', currentTargetId.current);
        socket.emit('webrtc-ice-candidate', {
          candidate: event.candidate,
          target: currentTargetId.current
        });
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
          currentTargetId.current = null;
        }
      }
    };

    // Handle ICE connection state
    peerConnection.current.oniceconnectionstatechange = () => {
      if (peerConnection.current) {
        const iceState = peerConnection.current.iceConnectionState;
        console.log('🧊 ICE Connection state:', iceState);
        
        // Process pending candidates if connection is ready
        if (iceState === 'checking' || iceState === 'connected') {
          while (pendingCandidates.current.length > 0) {
            const candidate = pendingCandidates.current.shift();
            if (candidate && peerConnection.current) {
              peerConnection.current.addIceCandidate(candidate).catch(console.error);
            }
          }
        }
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
      currentTargetId.current = targetId;
      
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
      currentTargetId.current = senderId;
      
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
    if (!peerConnection.current) {
      console.log('🧊 Storing ICE candidate for later');
      pendingCandidates.current.push(candidate);
      return;
    }

    try {
      console.log('🧊 Adding ICE candidate');
      await peerConnection.current.addIceCandidate(candidate);
      console.log('✅ ICE candidate added');
    } catch (error) {
      console.error('❌ Error handling ICE candidate:', error);
      // Store for retry
      pendingCandidates.current.push(candidate);
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
        
        // Update video element visibility
        if (localVideoRef.current) {
          localVideoRef.current.style.opacity = videoTrack.enabled ? '1' : '0';
        }
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

    currentTargetId.current = null;
    pendingCandidates.current = [];

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

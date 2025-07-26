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
  ];

  // Initialize WebRTC
  const initializeWebRTC = useCallback(async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setState(prev => ({ ...prev, localStream: stream }));

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      peerConnection.current = new RTCPeerConnection({ iceServers });

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        if (peerConnection.current) {
          peerConnection.current.addTrack(track, stream);
        }
      });

      // Handle remote stream
      peerConnection.current.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setState(prev => ({ ...prev, remoteStream, isConnected: true }));
        
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      };

      // Handle ICE candidates
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc-ice-candidate', {
            candidate: event.candidate,
            target: socket.id, // Will be set by the caller
          });
        }
      };

      // Handle connection state changes
      peerConnection.current.onconnectionstatechange = () => {
        if (peerConnection.current) {
          const state = peerConnection.current.connectionState;
          console.log('WebRTC Connection state:', state);
          
          if (state === 'disconnected' || state === 'failed') {
            setState(prev => ({ ...prev, isConnected: false, remoteStream: null }));
          }
        }
      };

    } catch (error) {
      console.error('Error initializing WebRTC:', error);
    }
  }, []);

  // Create offer (caller)
  const createOffer = useCallback(async (targetId: string) => {
    if (!peerConnection.current) return;

    try {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      socket.emit('webrtc-offer', {
        offer,
        target: targetId,
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }, []);

  // Create answer (callee)
  const createAnswer = useCallback(async (offer: RTCSessionDescriptionInit, senderId: string) => {
    if (!peerConnection.current) return;

    try {
      await peerConnection.current.setRemoteDescription(offer);
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit('webrtc-answer', {
        answer,
        target: senderId,
      });
    } catch (error) {
      console.error('Error creating answer:', error);
    }
  }, []);

  // Handle answer
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnection.current) return;

    try {
      await peerConnection.current.setRemoteDescription(answer);
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }, []);

  // Handle ICE candidate
  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    if (!peerConnection.current) return;

    try {
      await peerConnection.current.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }, []);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    if (state.localStream) {
      const videoTrack = state.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setState(prev => ({ ...prev, isCameraOn: videoTrack.enabled }));
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
      }
    }
  }, [state.localStream]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
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
    socket.on('webrtc-offer', ({ offer, sender }) => {
      createAnswer(offer, sender);
    });

    socket.on('webrtc-answer', ({ answer }) => {
      handleAnswer(answer);
    });

    socket.on('webrtc-ice-candidate', ({ candidate }) => {
      handleIceCandidate(candidate);
    });

    return () => {
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
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

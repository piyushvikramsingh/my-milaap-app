import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Header from './components/Header';
import VideoFrame from './components/VideoFrame';
import ChatSidebar from './components/ChatSidebar';
import ControlButtons from './components/ControlButtons';
import WelcomeScreen from './components/WelcomeScreen';
import { useSocketChat } from './hooks/useSocketChat';
import { useWebRTC } from './hooks/useWebRTC';

const App: React.FC = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const {
    currentUser,
    currentPartner,
    messages,
    isConnected,
    isConnecting,
    onlineCount,
    startSocketConnection,
    sendMessage,
    skipPartner,
    reportPartner,
    likePartner,
  } = useSocketChat();

  const {
    localStream,
    remoteStream,
    isConnected: webrtcConnected,
    isCameraOn,
    isMicOn,
    localVideoRef,
    remoteVideoRef,
    initializeWebRTC,
    createOffer,
    toggleCamera,
    toggleMic,
    cleanup: cleanupWebRTC,
  } = useWebRTC();

  const handleStart = useCallback(async () => {
    setIsStarting(true);
    const stream = await initializeWebRTC();
    if (stream) {
      console.log('✅ Media stream acquired. Connecting to server...');
      startSocketConnection();
      setIsStarted(true);
    } else {
      alert('Camera and microphone access are required to use StreamConnect. Please check your browser settings and try again.');
    }
    setIsStarting(false);
  }, [initializeWebRTC, startSocketConnection]);

  // Start WebRTC call when partner is found
  useEffect(() => {
    if (isConnected && currentPartner && localStream) {
      console.log('🎯 Partner found and local stream ready - starting WebRTC call...');
      // Small delay to ensure both sides are ready
      setTimeout(() => {
        createOffer(currentPartner.id);
      }, 1500);
    }
  }, [isConnected, currentPartner, localStream, createOffer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 App unmounting - cleaning up...');
      cleanupWebRTC();
    };
  }, [cleanupWebRTC]);

  if (!isStarted) {
    return <WelcomeScreen onStart={handleStart} isStarting={isStarting} />;
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header onlineCount={onlineCount} />
      
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Partner Video */}
            <motion.div
              className="relative order-1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <VideoFrame
                videoRef={remoteVideoRef}
                isConnected={isConnected}
                isConnecting={isConnecting}
                isPartner={true}
                partnerName={currentPartner?.name}
                hasVideo={!!remoteStream}
                isCameraOn={true} // Assume partner camera is on
                isMicOn={true} // Assume partner mic is on
                className="w-full h-full min-h-[300px] lg:min-h-[450px]"
              />
              {isConnected && currentPartner && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-4 left-4 bg-black bg-opacity-80 rounded-lg px-3 py-2 backdrop-blur-sm"
                >
                  <p className="text-white text-sm font-medium">
                    {currentPartner.name}
                  </p>
                  <p className="text-gray-300 text-xs">
                    {currentPartner.location}
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Your Video - Desktop */}
            <motion.div
              className="relative order-2 hidden lg:block"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <VideoFrame
                videoRef={localVideoRef}
                isConnected={true}
                isConnecting={false}
                isPartner={false}
                hasVideo={!!localStream}
                isCameraOn={isCameraOn}
                isMicOn={isMicOn}
                className="w-full h-full min-h-[300px] lg:min-h-[450px]"
              />
            </motion.div>
          </div>

          {/* Controls */}
          <div className="pb-safe">
            <ControlButtons
              onNext={skipPartner}
              onReport={reportPartner}
              onLike={likePartner}
              onToggleCamera={toggleCamera}
              onToggleMic={toggleMic}
              isConnected={isConnected}
              isConnecting={isConnecting}
              isCameraOn={isCameraOn}
              isMicOn={isMicOn}
            />
          </div>
        </div>

        {/* Chat Sidebar - Desktop */}
        <div className="w-80 hidden lg:block border-l border-gray-800">
          <ChatSidebar
            messages={messages}
            onSendMessage={sendMessage}
            isConnected={isConnected}
            partnerName={currentPartner?.name}
            currentUserId={currentUser?.id}
          />
        </div>
      </div>

      {/* Mobile Your Video (Picture-in-Picture) */}
      <motion.div
        className="lg:hidden fixed top-20 right-4 w-32 h-24 z-20 rounded-lg overflow-hidden border-2 border-gray-700 shadow-lg"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <VideoFrame
          videoRef={localVideoRef}
          isConnected={true}
          isConnecting={false}
          isPartner={false}
          hasVideo={!!localStream}
          isCameraOn={isCameraOn}
          isMicOn={isMicOn}
          className="w-full h-full"
        />
      </motion.div>

      {/* Mobile Chat Overlay */}
      <motion.div
        className="lg:hidden fixed bottom-24 left-4 right-4 h-48 bg-black bg-opacity-95 rounded-lg border border-gray-700 backdrop-blur-sm z-10 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <ChatSidebar
          messages={messages}
          onSendMessage={sendMessage}
          isConnected={isConnected}
          partnerName={currentPartner?.name}
          currentUserId={currentUser?.id}
        />
      </motion.div>

      {/* Connection Status Indicator */}
      {currentUser && (
        <motion.div
          className="fixed top-20 left-4 z-20"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center space-x-2 bg-black bg-opacity-80 rounded-lg px-3 py-2 backdrop-blur-sm border border-gray-700">
            <motion.div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-400' : isConnecting ? 'bg-yellow-400' : 'bg-red-400'
              }`}
              animate={{
                scale: isConnecting ? [1, 1.2, 1] : 1,
              }}
              transition={{
                duration: 1,
                repeat: isConnecting ? Infinity : 0,
              }}
            />
            <span className="text-white text-xs font-medium">
              {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Offline'}
            </span>
          </div>
        </motion.div>
      )}

      {/* WebRTC Status Indicator */}
      {webrtcConnected && (
        <motion.div
          className="fixed top-32 left-4 z-20"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center space-x-2 bg-green-600 bg-opacity-80 rounded-lg px-3 py-2 backdrop-blur-sm">
            <div className="w-2 h-2 bg-white rounded-full" />
            <span className="text-white text-xs font-medium">Video Call Active</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default App;

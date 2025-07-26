import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from './components/Header';
import VideoFrame from './components/VideoFrame';
import ChatSidebar from './components/ChatSidebar';
import ControlButtons from './components/ControlButtons';
import { useSocketChat } from './hooks/useSocketChat';
import { useWebRTC } from './hooks/useWebRTC';

const App: React.FC = () => {
  const {
    currentUser,
    currentPartner,
    messages,
    isConnected,
    isConnecting,
    onlineCount,
    findPartner,
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

  // Initialize WebRTC when component mounts
  useEffect(() => {
    initializeWebRTC();
    
    return () => {
      cleanupWebRTC();
    };
  }, [initializeWebRTC, cleanupWebRTC]);

  // Start WebRTC call when partner is found
  useEffect(() => {
    if (isConnected && currentPartner && localStream) {
      createOffer(currentPartner.id);
    }
  }, [isConnected, currentPartner, localStream, createOffer]);

  // Auto-find partner on first load
  useEffect(() => {
    if (currentUser && !isConnected && !isConnecting) {
      findPartner();
    }
  }, [currentUser, isConnected, isConnecting, findPartner]);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header onlineCount={onlineCount} />
      
      <div className="flex-1 flex">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* Partner Video */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0.9 }}
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
                  className="w-full h-full min-h-[300px] lg:min-h-[400px]"
                />
                {isConnected && currentPartner && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-4 left-4 bg-black bg-opacity-70 rounded-lg px-3 py-2"
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

              {/* Your Video */}
              <motion.div
                className="relative lg:block hidden"
                initial={{ opacity: 0, scale: 0.9 }}
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
                  className="w-full h-full min-h-[300px] lg:min-h-[400px]"
                />
              </motion.div>

              {/* Mobile: Your Video (smaller) */}
              <motion.div
                className="lg:hidden absolute top-20 right-6 w-32 h-24 z-10"
                initial={{ opacity: 0, scale: 0.9 }}
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
                  className="w-full h-full border-2 border-gray-700"
                />
              </motion.div>
            </div>
          </div>

          {/* Controls */}
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

        {/* Chat Sidebar */}
        <div className="w-80 hidden lg:block">
          <ChatSidebar
            messages={messages}
            onSendMessage={sendMessage}
            isConnected={isConnected}
            partnerName={currentPartner?.name}
            currentUserId={currentUser?.id}
          />
        </div>
      </div>

      {/* Mobile Chat Overlay */}
      <div className="lg:hidden fixed bottom-20 left-4 right-4 h-40 bg-black bg-opacity-90 rounded-lg border border-gray-700">
        <ChatSidebar
          messages={messages}
          onSendMessage={sendMessage}
          isConnected={isConnected}
          partnerName={currentPartner?.name}
          currentUserId={currentUser?.id}
        />
      </div>
    </div>
  );
};

export default App;

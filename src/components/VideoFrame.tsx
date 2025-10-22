import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Video, VideoOff, User, Mic, MicOff } from 'lucide-react';

interface VideoFrameProps {
  videoRef?: React.RefObject<HTMLVideoElement>;
  isConnected: boolean;
  isConnecting: boolean;
  isPartner?: boolean;
  partnerName?: string;
  hasVideo?: boolean;
  isCameraOn?: boolean;
  isMicOn?: boolean;
  className?: string;
}

const VideoFrame: React.FC<VideoFrameProps> = ({
  videoRef,
  isConnected,
  isConnecting,
  isPartner = false,
  partnerName,
  hasVideo = false,
  isCameraOn = true,
  isMicOn = true,
  className = '',
}) => {
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Handle video play with retry logic
  const handleVideoPlay = async (videoElement: HTMLVideoElement) => {
    if (!videoElement) return;

    try {
      await videoElement.play();
      retryCount.current = 0;
      console.log(`✅ Video playing successfully for ${isPartner ? 'partner' : 'local'}`);
    } catch (error) {
      console.error(`❌ Video play error for ${isPartner ? 'partner' : 'local'}:`, error);
      
      if (retryCount.current < maxRetries) {
        retryCount.current++;
        console.log(`🔄 Retrying video play (attempt ${retryCount.current}/${maxRetries})`);
        
        setTimeout(() => {
          handleVideoPlay(videoElement);
        }, 1000 * retryCount.current);
      } else {
        console.error(`❌ Max retries reached for ${isPartner ? 'partner' : 'local'} video`);
      }
    }
  };

  // Auto-play video when stream is available
  useEffect(() => {
    if (videoRef?.current && hasVideo && isCameraOn) {
      const videoElement = videoRef.current;
      
      // Configure video element
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.controls = false;
      
      if (!isPartner) {
        videoElement.muted = true; // Prevent audio feedback for local video
      }

      // Handle metadata loaded
      const handleLoadedMetadata = () => {
        console.log(`🎬 Video metadata loaded for ${isPartner ? 'partner' : 'local'}`);
        handleVideoPlay(videoElement);
      };

      // Handle can play
      const handleCanPlay = () => {
        console.log(`▶️ Video can play for ${isPartner ? 'partner' : 'local'}`);
        handleVideoPlay(videoElement);
      };

      // Handle error
      const handleError = (e: Event) => {
        console.error(`❌ Video error for ${isPartner ? 'partner' : 'local'}:`, e);
        // Reset retry count on new error
        retryCount.current = 0;
      };

      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.addEventListener('canplay', handleCanPlay);
      videoElement.addEventListener('error', handleError);

      // Initial play attempt
      if (videoElement.readyState >= 2) { // HAVE_CURRENT_DATA
        handleVideoPlay(videoElement);
      }

      return () => {
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.removeEventListener('canplay', handleCanPlay);
        videoElement.removeEventListener('error', handleError);
      };
    }
  }, [videoRef, hasVideo, isCameraOn, isPartner]);

  return (
    <div className={`relative bg-gradient-to-br from-gray-900 to-black rounded-lg overflow-hidden border border-gray-800 ${className}`}>
      {/* Video element */}
      {videoRef && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={!isPartner} // Mute local video to prevent feedback
          controls={false}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            !hasVideo || (!isCameraOn && !isPartner) ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ 
            transform: !isPartner ? 'scaleX(-1)' : 'none', // Mirror local video
            minHeight: '200px'
          }}
          onLoadedMetadata={() => {
            console.log(`🎬 Video loaded for ${isPartner ? 'partner' : 'local'}`);
          }}
          onError={(e) => {
            console.error(`❌ Video error for ${isPartner ? 'partner' : 'local'}:`, e);
          }}
          onPlay={() => {
            console.log(`▶️ Video started playing for ${isPartner ? 'partner' : 'local'}`);
          }}
          onPause={() => {
            console.log(`⏸️ Video paused for ${isPartner ? 'partner' : 'local'}`);
          }}
        />
      )}

      {/* Status overlay */}
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
        hasVideo && isCameraOn ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}>
        {isConnecting ? (
          <motion.div
            className="flex flex-col items-center space-y-4 text-center p-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="text-white text-sm font-medium">
              {isPartner ? 'Connecting to partner...' : 'Initializing camera...'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="flex flex-col items-center space-y-3 text-center p-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {!hasVideo ? (
              <>
                <User className="w-16 h-16 text-gray-500" />
                <div className="space-y-1">
                  <p className="text-white text-sm font-medium">
                    {isPartner ? (partnerName || 'Partner') : 'You'}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {isPartner ? 'Waiting for video...' : 'Camera not available'}
                  </p>
                </div>
              </>
            ) : !isCameraOn ? (
              <>
                <VideoOff className="w-16 h-16 text-red-400" />
                <div className="space-y-1">
                  <p className="text-white text-sm font-medium">
                    {isPartner ? (partnerName || 'Partner') : 'You'}
                  </p>
                  <p className="text-red-400 text-xs">Camera is off</p>
                </div>
              </>
            ) : (
              <>
                <Video className="w-16 h-16 text-green-400" />
                <div className="space-y-1">
                  <p className="text-white text-sm font-medium">
                    {isPartner ? (partnerName || 'Partner') : 'You'}
                  </p>
                  <p className="text-green-400 text-xs">Camera is on</p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Status indicators */}
      {(isConnected || hasVideo) && (
        <>
          {/* Name tag */}
          <div className="absolute top-3 left-3">
            <div className="flex items-center space-x-2 bg-black bg-opacity-70 rounded-full px-3 py-1 backdrop-blur-sm">
              <div className={`w-2 h-2 rounded-full ${
                hasVideo && isCameraOn ? 'bg-green-400' : 'bg-red-400'
              }`} />
              <span className="text-white text-xs font-medium">
                {isPartner ? (partnerName || 'Partner') : 'You'}
              </span>
            </div>
          </div>

          {/* Media status indicators */}
          <div className="absolute bottom-3 right-3 flex space-x-2">
            {/* Camera indicator */}
            <motion.div 
              className={`p-1.5 rounded-full backdrop-blur-sm ${
                isCameraOn ? 'bg-green-500 bg-opacity-70' : 'bg-red-500 bg-opacity-70'
              }`}
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              {isCameraOn ? (
                <Video className="w-3 h-3 text-white" />
              ) : (
                <VideoOff className="w-3 h-3 text-white" />
              )}
            </motion.div>

            {/* Mic indicator */}
            <motion.div 
              className={`p-1.5 rounded-full backdrop-blur-sm ${
                isMicOn ? 'bg-green-500 bg-opacity-70' : 'bg-red-500 bg-opacity-70'
              }`}
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              {isMicOn ? (
                <Mic className="w-3 h-3 text-white" />
              ) : (
                <MicOff className="w-3 h-3 text-white" />
              )}
            </motion.div>
          </div>
        </>
      )}

      {/* Connection quality indicator */}
      {isPartner && isConnected && hasVideo && (
        <motion.div
          className="absolute top-3 right-3"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center space-x-1 bg-black bg-opacity-70 rounded-full px-2 py-1 backdrop-blur-sm">
            <motion.div 
              className="w-1.5 h-1.5 bg-green-400 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div 
              className="w-1.5 h-1.5 bg-green-400 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div 
              className="w-1.5 h-1.5 bg-green-400 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
            />
            <span className="text-green-400 text-xs ml-1">HD</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default VideoFrame;

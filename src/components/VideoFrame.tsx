import React from 'react';
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
  return (
    <div className={`relative bg-gradient-to-br from-gray-900 to-black rounded-lg overflow-hidden border border-gray-800 ${className}`}>
      {/* Video element */}
      {videoRef && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={!isPartner} // Mute local video to prevent feedback
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
              {isPartner ? 'Connecting to partner...' : 'Finding your camera...'}
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
            <div className={`p-1.5 rounded-full backdrop-blur-sm ${
              isCameraOn ? 'bg-green-500 bg-opacity-70' : 'bg-red-500 bg-opacity-70'
            }`}>
              {isCameraOn ? (
                <Video className="w-3 h-3 text-white" />
              ) : (
                <VideoOff className="w-3 h-3 text-white" />
              )}
            </div>

            {/* Mic indicator */}
            <div className={`p-1.5 rounded-full backdrop-blur-sm ${
              isMicOn ? 'bg-green-500 bg-opacity-70' : 'bg-red-500 bg-opacity-70'
            }`}>
              {isMicOn ? (
                <Mic className="w-3 h-3 text-white" />
              ) : (
                <MicOff className="w-3 h-3 text-white" />
              )}
            </div>
          </div>
        </>
      )}

      {/* Connection quality indicator */}
      {isPartner && isConnected && hasVideo && (
        <div className="absolute top-3 right-3">
          <div className="flex items-center space-x-1 bg-black bg-opacity-70 rounded-full px-2 py-1 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            <span className="text-green-400 text-xs ml-1">HD</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoFrame;

import React from 'react';
import { motion } from 'framer-motion';
import { Video, VideoOff, User } from 'lucide-react';

interface VideoFrameProps {
  videoRef?: React.RefObject<HTMLVideoElement>;
  isConnected: boolean;
  isConnecting: boolean;
  isPartner?: boolean;
  partnerName?: string;
  hasVideo?: boolean;
  isCameraOn?: boolean;
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
  className = '',
}) => {
  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Video element */}
      {hasVideo && videoRef && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={!isPartner} // Mute local video to avoid feedback
          className={`w-full h-full object-cover ${!isCameraOn ? 'hidden' : ''}`}
        />
      )}

      {/* Placeholder/Status display */}
      <div className={`absolute inset-0 flex items-center justify-center ${hasVideo && isCameraOn ? 'hidden' : ''}`}>
        {isConnecting ? (
          <motion.div
            className="flex flex-col items-center space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-8 h-8 border-2 border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="text-white text-sm">
              {isPartner ? 'Connecting...' : 'Finding partner...'}
            </p>
          </motion.div>
        ) : isConnected ? (
          <motion.div
            className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center space-y-2">
              {isCameraOn === false ? (
                <VideoOff className="w-12 h-12 text-red-400" />
              ) : (
                <Video className="w-12 h-12 text-green-400" />
              )}
              {isPartner && partnerName && (
                <p className="text-white text-sm font-medium">{partnerName}</p>
              )}
              {!isPartner && (
                <p className="text-white text-sm">You</p>
              )}
              {!isCameraOn && (
                <p className="text-red-400 text-xs">Camera off</p>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <User className="w-12 h-12 text-gray-500" />
            <p className="text-gray-500 text-sm">
              {isPartner ? 'No partner' : 'You'}
            </p>
          </div>
        )}
      </div>

      {/* User indicator */}
      {isConnected && (
        <div className="absolute top-3 left-3">
          <div className="flex items-center space-x-2 bg-black bg-opacity-50 rounded-full px-3 py-1">
            <div className={`w-2 h-2 rounded-full ${
              hasVideo && isCameraOn ? 'bg-green-400' : 'bg-red-400'
            }`} />
            <span className="text-white text-xs">
              {isPartner ? (partnerName || 'Partner') : 'You'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoFrame;

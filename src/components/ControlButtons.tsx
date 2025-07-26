import React from 'react';
import { motion } from 'framer-motion';
import { SkipForward, Flag, Heart, Mic, MicOff, Video, VideoOff } from 'lucide-react';

interface ControlButtonsProps {
  onNext: () => void;
  onReport: () => void;
  onLike: () => void;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  isConnected: boolean;
  isConnecting: boolean;
  isCameraOn: boolean;
  isMicOn: boolean;
}

const ControlButtons: React.FC<ControlButtonsProps> = ({
  onNext,
  onReport,
  onLike,
  onToggleCamera,
  onToggleMic,
  isConnected,
  isConnecting,
  isCameraOn,
  isMicOn,
}) => {
  return (
    <div className="flex items-center justify-center space-x-4 p-6">
      {/* Secondary Controls */}
      <div className="flex items-center space-x-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleMic}
          className={`p-3 rounded-full transition-colors ${
            !isMicOn ? 'bg-red-600 text-white' : 'bg-gray-800 text-white hover:bg-gray-700'
          }`}
        >
          {!isMicOn ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleCamera}
          className={`p-3 rounded-full transition-colors ${
            !isCameraOn ? 'bg-red-600 text-white' : 'bg-gray-800 text-white hover:bg-gray-700'
          }`}
        >
          {!isCameraOn ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </motion.button>
      </div>

      {/* Main Controls */}
      <div className="flex items-center space-x-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReport}
          disabled={!isConnected}
          className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Flag className="w-5 h-5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNext}
          disabled={isConnecting}
          className="p-4 bg-white text-black rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium min-w-[64px]"
        >
          {isConnecting ? (
            <motion.div
              className="w-6 h-6 border-2 border-black border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            <SkipForward className="w-6 h-6" />
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLike}
          disabled={!isConnected}
          className="p-3 bg-pink-600 text-white rounded-full hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Heart className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
};

export default ControlButtons;

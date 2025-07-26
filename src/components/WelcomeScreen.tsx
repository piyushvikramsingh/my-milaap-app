import React from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, Video } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
  isStarting: boolean;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, isStarting }) => {
  return (
    <motion.div
      className="fixed inset-0 bg-black flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Video className="w-24 h-24 text-blue-500 mx-auto mb-6" />
          <h1 className="text-5xl font-bold text-white mb-4">StreamConnect</h1>
          <p className="text-lg text-gray-300 mb-8 max-w-md mx-auto">
            Connect with people worldwide through random video chat. Click start to begin your journey.
          </p>
        </motion.div>

        <motion.button
          onClick={onStart}
          disabled={isStarting}
          className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-wait transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isStarting ? (
            <motion.div
              className="w-6 h-6 border-2 border-white border-t-transparent rounded-full mr-3"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            <PlayCircle className="w-6 h-6 mr-3" />
          )}
          <span>{isStarting ? 'Starting...' : 'Start Connecting'}</span>
        </motion.button>
        
        <p className="text-xs text-gray-500 mt-6">
          By starting, you agree to our terms and to enable your camera and microphone.
        </p>
      </div>
    </motion.div>
  );
};

export default WelcomeScreen;

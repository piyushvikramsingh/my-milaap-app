import React from 'react';
import { Users, Settings, Info } from 'lucide-react';

interface HeaderProps {
  onlineCount?: number;
}

const Header: React.FC<HeaderProps> = ({ onlineCount = 0 }) => {
  return (
    <header className="bg-black border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-white">StreamConnect</h1>
          <div className="flex items-center space-x-2 text-green-400">
            <Users className="w-4 h-4" />
            <span className="text-sm">{onlineCount.toLocaleString()} online</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <Info className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

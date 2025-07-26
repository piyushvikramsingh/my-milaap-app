import { useState, useEffect, useCallback, useRef } from 'react';
import { socket, connectSocket } from '../services/socket';
import { User, Message } from '../types';

export const useSocketChat = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPartner, setCurrentPartner] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  // This function will be called from the UI to initiate the connection
  const startSocketConnection = useCallback(() => {
    if (!socket.connected) {
      console.log('🔌 Connecting to server via explicit call...');
      setConnectionError(null);
      connectSocket();
    }
  }, []);

  // Handle connection recovery
  const handleConnectionRecovery = useCallback(() => {
    if (reconnectAttempts.current < maxReconnectAttempts) {
      reconnectAttempts.current++;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
      
      console.log(`🔄 Attempting to reconnect... (${reconnectAttempts.current}/${maxReconnectAttempts}) in ${delay}ms`);
      
      const errorMessage: Message = {
        id: `${Date.now()}-system`,
        userId: 'system',
        content: `⚠️ Connection lost. Reconnecting... (${reconnectAttempts.current}/${maxReconnectAttempts})`,
        timestamp: new Date(),
        type: 'system',
      };
      setMessages(prev => [...prev, errorMessage]);
      
      reconnectTimeout.current = setTimeout(() => {
        connectSocket();
      }, delay);
    } else {
      setConnectionError('Unable to connect to server. Please refresh the page.');
      const errorMessage: Message = {
        id: `${Date.now()}-system`,
        userId: 'system',
        content: '❌ Connection failed. Please refresh the page.',
        timestamp: new Date(),
        type: 'system',
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, []);

  // Setup socket event listeners on mount
  useEffect(() => {
    console.log('Setting up socket listeners...');

    const onConnect = () => {
      console.log('✅ Connected to server');
      reconnectAttempts.current = 0;
      setConnectionError(null);
      
      const names = ['Alex', 'Sam', 'Jordan', 'Casey', 'Taylor', 'Morgan', 'Riley', 'Blake', 'Avery', 'Quinn'];
      const cities = ['New York', 'London', 'Tokyo', 'Paris', 'Sydney', 'Berlin', 'Toronto', 'Mumbai', 'Seoul', 'São Paulo'];
      const countries = ['USA', 'UK', 'Japan', 'France', 'Australia', 'Germany', 'Canada', 'India', 'South Korea', 'Brazil'];
      
      const userData = {
        name: names[Math.floor(Math.random() * names.length)],
        location: `${cities[Math.floor(Math.random() * cities.length)]}, ${countries[Math.floor(Math.random() * countries.length)]}`,
      };
      
      console.log('👤 Registering user:', userData);
      socket.emit('join-platform', userData);
    };

    const onConnectError = (error: any) => {
      console.error('❌ Connection error:', error);
      setConnectionError('Failed to connect to server');
      handleConnectionRecovery();
    };

    const onUserRegistered = (user: User) => {
      console.log('✅ User registered:', user);
      setCurrentUser(user);
    };

    const onOnlineCount = (count: number) => {
      console.log('👥 Online count updated:', count);
      setOnlineCount(count);
    };

    const onQueueJoined = ({ position }: { position: number }) => {
      console.log('📋 Joined queue at position:', position);
      const queueMessage: Message = {
        id: `${Date.now()}-system`,
        userId: 'system',
        content: `🎯 Looking for a partner... ${position > 1 ? `(${position} in queue)` : ''}`,
        timestamp: new Date(),
        type: 'system',
      };
      setMessages(prev => [...prev, queueMessage]);
    };

    const onPartnerFound = ({ partner, roomId }: { partner: User, roomId: string }) => {
      console.log('🎯 Partner found:', partner, 'Room:', roomId);
      setCurrentPartner(partner);
      setIsConnecting(false);
      setIsConnected(true);
      setMessages([]);
      
      const systemMessage: Message = {
        id: `${Date.now()}-system`,
        userId: 'system',
        content: `🎉 Connected with ${partner.name} from ${partner.location}`,
        timestamp: new Date(),
        type: 'system',
      };
      setMessages([systemMessage]);
    };

    const onNewMessage = (message: Message) => {
      console.log('💬 New message received:', message);
      setMessages(prev => [...prev, message]);
    };

    const onPartnerDisconnected = () => {
      console.log('👋 Partner disconnected');
      handlePartnerLeave('Partner disconnected. Finding new partner...');
    };

    const onPartnerSkipped = () => {
      console.log('⏭️ Partner skipped');
      handlePartnerLeave('Partner skipped to next person. Finding new partner...');
    };

    const onPartnerReported = () => {
      console.log('🚨 You were reported');
      handlePartnerLeave('You were reported. Finding new partner...');
    };

    const onPartnerLiked = ({ from }: { from: User }) => {
      console.log('❤️ Partner liked you:', from);
      const likeMessage: Message = {
        id: `${Date.now()}-system`,
        userId: 'system',
        content: `❤️ ${from.name} liked you!`,
        timestamp: new Date(),
        type: 'system',
      };
      setMessages(prev => [...prev, likeMessage]);
    };

    const onDisconnect = (reason: string) => {
      console.log('❌ Disconnected from server. Reason:', reason);
      setCurrentPartner(null);
      setIsConnected(false);
      setIsConnecting(false);
      
      // Only attempt reconnection if it wasn't intentional
      if (reason !== 'io client disconnect') {
        handleConnectionRecovery();
      }
    };

    const onError = (error: any) => {
      console.error('❌ Socket error:', error);
      setConnectionError('Connection error occurred');
      
      const errorMessage: Message = {
        id: `${Date.now()}-system`,
        userId: 'system',
        content: '⚠️ Connection issue detected. Attempting to reconnect...',
        timestamp: new Date(),
        type: 'system',
      };
      setMessages(prev => [...prev, errorMessage]);
    };

    // Attach listeners
    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    socket.on('user-registered', onUserRegistered);
    socket.on('online-count', onOnlineCount);
    socket.on('queue-joined', onQueueJoined);
    socket.on('partner-found', onPartnerFound);
    socket.on('new-message', onNewMessage);
    socket.on('partner-disconnected', onPartnerDisconnected);
    socket.on('partner-skipped', onPartnerSkipped);
    socket.on('partner-reported', onPartnerReported);
    socket.on('partner-liked', onPartnerLiked);
    socket.on('disconnect', onDisconnect);
    socket.on('error', onError);

    return () => {
      console.log('🧹 Cleaning up socket listeners');
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
      socket.off('user-registered', onUserRegistered);
      socket.off('online-count', onOnlineCount);
      socket.off('queue-joined', onQueueJoined);
      socket.off('partner-found', onPartnerFound);
      socket.off('new-message', onNewMessage);
      socket.off('partner-disconnected', onPartnerDisconnected);
      socket.off('partner-skipped', onPartnerSkipped);
      socket.off('partner-reported', onPartnerReported);
      socket.off('partner-liked', onPartnerLiked);
      socket.off('disconnect', onDisconnect);
      socket.off('error', onError);
    };
  }, [handleConnectionRecovery]);

  // Helper function to handle partner leaving
  const handlePartnerLeave = useCallback((message: string) => {
    const leaveMessage: Message = {
      id: `${Date.now()}-system`,
      userId: 'system',
      content: message,
      timestamp: new Date(),
      type: 'system',
    };
    setMessages(prev => [...prev, leaveMessage]);
    setCurrentPartner(null);
    setIsConnected(false);
    
    // Clear any existing search timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      console.log('🔄 Auto-starting new partner search...');
      findPartner();
    }, 2000);
  }, []);

  const findPartner = useCallback(() => {
    if (isConnecting) {
      console.log('⏳ Already searching for partner...');
      return;
    }

    if (!socket.connected) {
      console.log('❌ Socket not connected. Cannot search for partner.');
      setConnectionError('Not connected to server');
      return;
    }

    console.log('🔍 Finding new partner...');
    setIsConnecting(true);
    setIsConnected(false);
    setCurrentPartner(null);
    
    const searchMessage: Message = {
      id: `${Date.now()}-system`,
      userId: 'system',
      content: '🔍 Searching for a new partner...',
      timestamp: new Date(),
      type: 'system',
    };
    setMessages([searchMessage]);
    
    socket.emit('find-partner');

    // Set a timeout to handle search failures
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      if (isConnecting && !currentPartner) {
        console.log('⏰ Search timeout. Retrying...');
        const timeoutMessage: Message = {
          id: `${Date.now()}-system`,
          userId: 'system',
          content: '⏰ Search taking longer than expected. Retrying...',
          timestamp: new Date(),
          type: 'system',
        };
        setMessages(prev => [...prev, timeoutMessage]);
        
        // Retry search
        socket.emit('find-partner');
      }
    }, 15000); // 15 second timeout
  }, [isConnecting, currentPartner]);

  const sendMessage = useCallback((content: string) => {
    if (!content.trim() || !isConnected || !socket.connected) {
      return;
    }
    socket.emit('send-message', { content: content.trim() });
  }, [isConnected]);

  const skipPartner = useCallback(() => {
    if (!socket.connected) return;
    
    socket.emit('skip-partner');
    
    const skipMessage: Message = {
      id: `${Date.now()}-system`,
      userId: 'system',
      content: '⏭️ Skipping to next person...',
      timestamp: new Date(),
      type: 'system',
    };
    setMessages(prev => [...prev, skipMessage]);
    setIsConnecting(true);
  }, []);

  const reportPartner = useCallback((reason = 'inappropriate_behavior') => {
    if (!socket.connected) return;
    
    socket.emit('report-partner', reason);
    
    const reportMessage: Message = {
      id: `${Date.now()}-system`,
      userId: 'system',
      content: '🚨 Partner reported. Finding new partner...',
      timestamp: new Date(),
      type: 'system',
    };
    setMessages(prev => [...prev, reportMessage]);
    setIsConnecting(true);
  }, []);

  const likePartner = useCallback(() => {
    if (!socket.connected) return;
    
    socket.emit('like-partner');
    
    const likeMessage: Message = {
      id: `${Date.now()}-system`,
      userId: 'system',
      content: '❤️ You liked this person!',
      timestamp: new Date(),
      type: 'system',
    };
    setMessages(prev => [...prev, likeMessage]);
  }, []);

  // Auto-start finding partner when user registers
  useEffect(() => {
    if (currentUser && !isConnected && !isConnecting && !currentPartner && socket.connected) {
      console.log('🚀 Auto-starting partner search for new user...');
      
      // Clear any existing search timeout
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      
      searchTimeout.current = setTimeout(() => {
        findPartner();
      }, 1000);
    }
  }, [currentUser, isConnected, isConnecting, currentPartner, findPartner]);

  return {
    currentUser,
    currentPartner,
    messages,
    isConnected,
    isConnecting,
    onlineCount,
    connectionError,
    startSocketConnection,
    findPartner,
    sendMessage,
    skipPartner,
    reportPartner,
    likePartner,
  };
};

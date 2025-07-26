import { useState, useEffect, useCallback } from 'react';
import { socket, connectSocket } from '../services/socket';
import { User, Message } from '../types';

export const useSocketChat = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPartner, setCurrentPartner] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  // This function will be called from the UI to initiate the connection
  const startSocketConnection = useCallback(() => {
    if (!socket.connected) {
      console.log('🔌 Connecting to server via explicit call...');
      connectSocket();
    }
  }, []);

  // Setup socket event listeners on mount
  useEffect(() => {
    console.log('Setting up socket listeners...');

    const onConnect = () => {
      console.log('✅ Connected to server');
      
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

    const onUserRegistered = (user: User) => {
      console.log('✅ User registered:', user);
      setCurrentUser(user);
    };

    const onOnlineCount = (count: number) => {
      console.log('👥 Online count updated:', count);
      setOnlineCount(count);
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

    const onDisconnect = () => {
      console.log('❌ Disconnected from server');
      setCurrentPartner(null);
      setIsConnected(false);
      setIsConnecting(false);
    };

    // Attach listeners
    socket.on('connect', onConnect);
    socket.on('user-registered', onUserRegistered);
    socket.on('online-count', onOnlineCount);
    socket.on('partner-found', onPartnerFound);
    socket.on('new-message', onNewMessage);
    socket.on('partner-disconnected', onPartnerDisconnected);
    socket.on('partner-skipped', onPartnerSkipped);
    socket.on('partner-reported', onPartnerReported);
    socket.on('partner-liked', onPartnerLiked);
    socket.on('disconnect', onDisconnect);

    return () => {
      console.log('🧹 Cleaning up socket listeners');
      socket.off('connect', onConnect);
      socket.off('user-registered', onUserRegistered);
      socket.off('online-count', onOnlineCount);
      socket.off('partner-found', onPartnerFound);
      socket.off('new-message', onNewMessage);
      socket.off('partner-disconnected', onPartnerDisconnected);
      socket.off('partner-skipped', onPartnerSkipped);
      socket.off('partner-reported', onPartnerReported);
      socket.off('partner-liked', onPartnerLiked);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

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
    
    setTimeout(() => {
      console.log('🔄 Auto-starting new partner search...');
      findPartner();
    }, 2000);
  }, []);

  const findPartner = useCallback(() => {
    if (isConnecting) {
      console.log('⏳ Already searching for partner...');
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
  }, [isConnecting]);

  const sendMessage = useCallback((content: string) => {
    if (!content.trim() || !isConnected) {
      return;
    }
    socket.emit('send-message', { content: content.trim() });
  }, [isConnected]);

  const skipPartner = useCallback(() => {
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
    if (currentUser && !isConnected && !isConnecting && !currentPartner) {
      console.log('🚀 Auto-starting partner search for new user...');
      setTimeout(() => {
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
    startSocketConnection,
    findPartner,
    sendMessage,
    skipPartner,
    reportPartner,
    likePartner,
  };
};

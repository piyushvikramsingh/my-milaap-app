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

  // Initialize socket connection
  useEffect(() => {
    connectSocket();

    // Register user when socket connects
    socket.on('connect', () => {
      console.log('Connected to server');
      
      const userData = {
        name: `User${Math.floor(Math.random() * 1000)}`,
        location: 'Earth', // You can implement geolocation here
      };
      
      socket.emit('join-platform', userData);
    });

    socket.on('user-registered', (user: User) => {
      setCurrentUser(user);
    });

    socket.on('online-count', (count: number) => {
      setOnlineCount(count);
    });

    socket.on('partner-found', ({ partner, roomId }) => {
      console.log('Partner found:', partner);
      setCurrentPartner(partner);
      setIsConnecting(false);
      setIsConnected(true);
      setMessages([]);
      
      // Add system message
      const systemMessage: Message = {
        id: `${Date.now()}-system`,
        userId: 'system',
        content: `Connected with ${partner.name} from ${partner.location}`,
        timestamp: new Date(),
        type: 'system',
      };
      setMessages([systemMessage]);
    });

    socket.on('new-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('partner-disconnected', () => {
      const disconnectMessage: Message = {
        id: `${Date.now()}-system`,
        userId: 'system',
        content: 'Partner disconnected',
        timestamp: new Date(),
        type: 'system',
      };
      setMessages(prev => [...prev, disconnectMessage]);
      setCurrentPartner(null);
      setIsConnected(false);
    });

    socket.on('partner-skipped', () => {
      const skipMessage: Message = {
        id: `${Date.now()}-system`,
        userId: 'system',
        content: 'Partner skipped to next person',
        timestamp: new Date(),
        type: 'system',
      };
      setMessages(prev => [...prev, skipMessage]);
      setCurrentPartner(null);
      setIsConnected(false);
    });

    socket.on('partner-reported', () => {
      const reportMessage: Message = {
        id: `${Date.now()}-system`,
        userId: 'system',
        content: 'You were reported by your partner',
        timestamp: new Date(),
        type: 'system',
      };
      setMessages(prev => [...prev, reportMessage]);
      setCurrentPartner(null);
      setIsConnected(false);
    });

    socket.on('partner-liked', ({ from }) => {
      const likeMessage: Message = {
        id: `${Date.now()}-system`,
        userId: 'system',
        content: `❤️ ${from.name} liked you!`,
        timestamp: new Date(),
        type: 'system',
      };
      setMessages(prev => [...prev, likeMessage]);
    });

    return () => {
      socket.off('connect');
      socket.off('user-registered');
      socket.off('online-count');
      socket.off('partner-found');
      socket.off('new-message');
      socket.off('partner-disconnected');
      socket.off('partner-skipped');
      socket.off('partner-reported');
      socket.off('partner-liked');
    };
  }, []);

  const findPartner = useCallback(() => {
    setIsConnecting(true);
    setIsConnected(false);
    setCurrentPartner(null);
    setMessages([]);
    socket.emit('find-partner');
  }, []);

  const sendMessage = useCallback((content: string) => {
    if (!content.trim() || !isConnected) return;

    socket.emit('send-message', { content: content.trim() });
  }, [isConnected]);

  const skipPartner = useCallback(() => {
    socket.emit('skip-partner');
    setIsConnecting(true);
    socket.emit('find-partner');
  }, []);

  const reportPartner = useCallback((reason = 'inappropriate_behavior') => {
    socket.emit('report-partner', reason);
    setIsConnecting(true);
    socket.emit('find-partner');
  }, []);

  const likePartner = useCallback(() => {
    socket.emit('like-partner');
  }, []);

  return {
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
  };
};

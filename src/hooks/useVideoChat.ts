import { useState, useEffect, useCallback } from 'react';
import { faker } from '@faker-js/faker';
import { User, Message, ChatSession } from '../types';

export const useVideoChat = () => {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const generateRandomUser = (): User => ({
    id: faker.string.uuid(),
    name: faker.person.firstName(),
    location: `${faker.location.city()}, ${faker.location.country()}`,
    isOnline: true,
  });

  const findNewPartner = useCallback(async () => {
    setIsConnecting(true);
    setIsConnected(false);
    setMessages([]);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    const newPartner = generateRandomUser();
    const newSession: ChatSession = {
      id: faker.string.uuid(),
      partner: newPartner,
      messages: [],
      startTime: new Date(),
      isActive: true,
    };

    setCurrentSession(newSession);
    setIsConnecting(false);
    setIsConnected(true);

    // Add system message
    const systemMessage: Message = {
      id: faker.string.uuid(),
      userId: 'system',
      content: `Connected with ${newPartner.name} from ${newPartner.location}`,
      timestamp: new Date(),
      type: 'system',
    };
    setMessages([systemMessage]);

    // Simulate partner typing after a delay
    setTimeout(() => {
      const partnerMessage: Message = {
        id: faker.string.uuid(),
        userId: newPartner.id,
        content: faker.helpers.arrayElement([
          'Hey! How are you?',
          'Hello there!',
          'Hi! Nice to meet you',
          'What\'s up?',
          'How\'s your day going?',
        ]),
        timestamp: new Date(),
        type: 'text',
      };
      setMessages(prev => [...prev, partnerMessage]);
    }, 2000 + Math.random() * 3000);
  }, []);

  const sendMessage = useCallback((content: string) => {
    if (!currentSession || !content.trim()) return;

    const newMessage: Message = {
      id: faker.string.uuid(),
      userId: 'user',
      content: content.trim(),
      timestamp: new Date(),
      type: 'text',
    };

    setMessages(prev => [...prev, newMessage]);

    // Simulate partner response
    setTimeout(() => {
      const responses = [
        'That\'s interesting!',
        'I agree!',
        'Really?',
        'Cool!',
        'Nice!',
        'What do you think about that?',
        'Tell me more',
        'Haha',
        'Same here',
        'I see',
      ];

      const partnerMessage: Message = {
        id: faker.string.uuid(),
        userId: currentSession.partner.id,
        content: faker.helpers.arrayElement(responses),
        timestamp: new Date(),
        type: 'text',
      };
      setMessages(prev => [...prev, partnerMessage]);
    }, 1000 + Math.random() * 2000);
  }, [currentSession]);

  const skipPartner = useCallback(() => {
    if (currentSession) {
      const skipMessage: Message = {
        id: faker.string.uuid(),
        userId: 'system',
        content: 'Partner disconnected. Finding new partner...',
        timestamp: new Date(),
        type: 'system',
      };
      setMessages(prev => [...prev, skipMessage]);
    }
    
    setCurrentSession(null);
    setIsConnected(false);
    findNewPartner();
  }, [currentSession, findNewPartner]);

  const reportPartner = useCallback(() => {
    if (currentSession) {
      const reportMessage: Message = {
        id: faker.string.uuid(),
        userId: 'system',
        content: 'Partner reported. Finding new partner...',
        timestamp: new Date(),
        type: 'system',
      };
      setMessages(prev => [...prev, reportMessage]);
      
      setTimeout(() => {
        skipPartner();
      }, 1000);
    }
  }, [currentSession, skipPartner]);

  const likePartner = useCallback(() => {
    if (currentSession) {
      const likeMessage: Message = {
        id: faker.string.uuid(),
        userId: 'system',
        content: '❤️ You liked this person!',
        timestamp: new Date(),
        type: 'system',
      };
      setMessages(prev => [...prev, likeMessage]);
    }
  }, [currentSession]);

  return {
    currentSession,
    isConnecting,
    isConnected,
    messages,
    findNewPartner,
    sendMessage,
    skipPartner,
    reportPartner,
    likePartner,
  };
};

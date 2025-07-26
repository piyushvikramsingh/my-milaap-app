export interface User {
  id: string;
  name: string;
  location: string;
  avatar?: string;
  isOnline: boolean;
}

export interface Message {
  id: string;
  userId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system';
}

export interface ChatSession {
  id: string;
  partner: User;
  messages: Message[];
  startTime: Date;
  isActive: boolean;
}

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || ["http://localhost:5173", "http://localhost:3000", "https://*.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: process.env.CLIENT_URL || ["http://localhost:5173", "http://localhost:3000", "https://*.vercel.app"],
  credentials: true
}));
app.use(express.json());

// Store active users and rooms
const activeUsers = new Map();
const waitingQueue = [];
const activeRooms = new Map();

// Simulate baseline online users for demo
let simulatedOnlineCount = Math.floor(Math.random() * 1000) + 100;

// Update simulated count periodically to look realistic
setInterval(() => {
  const change = Math.floor(Math.random() * 20) - 10; // -10 to +10
  simulatedOnlineCount = Math.max(50, simulatedOnlineCount + change);
}, 30000); // Every 30 seconds

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    users: activeUsers.size,
    rooms: activeRooms.size,
    waiting: waitingQueue.length,
    totalOnline: simulatedOnlineCount + activeUsers.size
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    connectedUsers: activeUsers.size,
    activeRooms: activeRooms.size,
    waitingInQueue: waitingQueue.length,
    simulatedUsers: simulatedOnlineCount,
    totalOnline: simulatedOnlineCount + activeUsers.size
  });
});

// Auto-match function - runs more frequently for better experience
const autoMatch = () => {
  if (waitingQueue.length >= 2) {
    console.log(`🔄 Auto-matching: ${waitingQueue.length} users in queue`);
    matchUsers();
  }
};

// Run auto-match every 1.5 seconds for faster matching
setInterval(autoMatch, 1500);

// Socket.IO Connection Handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // User joins the platform
  socket.on('join-platform', (userData) => {
    const user = {
      id: socket.id,
      name: userData.name || `User${Math.floor(Math.random() * 1000)}`,
      location: userData.location || getRandomLocation(),
      joinedAt: new Date(),
      isActive: true
    };
    
    activeUsers.set(socket.id, user);
    
    socket.emit('user-registered', user);
    
    // Broadcast updated online count
    const totalOnline = simulatedOnlineCount + activeUsers.size;
    io.emit('online-count', totalOnline);
    
    console.log(`✅ User ${user.name} joined from ${user.location}. Total online: ${totalOnline}`);
  });

  // Find new partner
  socket.on('find-partner', () => {
    const user = activeUsers.get(socket.id);
    if (!user) {
      console.log('❌ User not found for find-partner request');
      return;
    }

    console.log(`🔍 ${user.name} is looking for a partner`);

    // Remove from any existing room first
    leaveCurrentRoom(socket.id);

    // Add to waiting queue if not already there
    const existingIndex = waitingQueue.findIndex(u => u.id === socket.id);
    if (existingIndex === -1) {
      waitingQueue.push(user);
      console.log(`➕ Added ${user.name} to queue. Queue length: ${waitingQueue.length}`);
    } else {
      console.log(`⚠️ ${user.name} already in queue`);
    }

    // Try to match immediately
    setTimeout(matchUsers, 200);
  });

  // Send message in room
  socket.on('send-message', (data) => {
    const user = activeUsers.get(socket.id);
    const room = findUserRoom(socket.id);
    
    if (room && user && data.content) {
      const message = {
        id: uuidv4(),
        userId: socket.id,
        userName: user.name,
        content: data.content,
        timestamp: new Date(),
        type: 'text'
      };
      
      console.log(`💬 Message in room ${room}: ${user.name}: ${data.content}`);
      io.to(room).emit('new-message', message);
    }
  });

  // WebRTC signaling
  socket.on('webrtc-offer', (data) => {
    console.log(`📞 WebRTC offer from ${socket.id} to ${data.target}`);
    socket.to(data.target).emit('webrtc-offer', {
      offer: data.offer,
      sender: socket.id
    });
  });

  socket.on('webrtc-answer', (data) => {
    console.log(`📞 WebRTC answer from ${socket.id} to ${data.target}`);
    socket.to(data.target).emit('webrtc-answer', {
      answer: data.answer,
      sender: socket.id
    });
  });

  socket.on('webrtc-ice-candidate', (data) => {
    console.log(`🧊 ICE candidate from ${socket.id} to ${data.target}`);
    socket.to(data.target).emit('webrtc-ice-candidate', {
      candidate: data.candidate,
      sender: socket.id
    });
  });

  // Skip current partner
  socket.on('skip-partner', () => {
    const user = activeUsers.get(socket.id);
    console.log(`⏭️ ${user?.name || socket.id} skipped partner`);
    
    const room = findUserRoom(socket.id);
    if (room) {
      const roomData = activeRooms.get(room);
      if (roomData) {
        const partnerId = roomData.users.find(id => id !== socket.id);
        if (partnerId) {
          console.log(`📢 Notifying ${partnerId} about skip`);
          io.to(partnerId).emit('partner-skipped');
        }
      }
    }
    
    leaveCurrentRoom(socket.id);
  });

  // Report partner
  socket.on('report-partner', (reason) => {
    const user = activeUsers.get(socket.id);
    console.log(`🚨 ${user?.name || socket.id} reported partner for: ${reason}`);
    
    const room = findUserRoom(socket.id);
    if (room) {
      const roomData = activeRooms.get(room);
      if (roomData) {
        const partnerId = roomData.users.find(id => id !== socket.id);
        if (partnerId) {
          console.log(`📢 Notifying ${partnerId} about report`);
          io.to(partnerId).emit('partner-reported');
        }
      }
    }
    
    leaveCurrentRoom(socket.id);
  });

  // Like partner
  socket.on('like-partner', () => {
    const user = activeUsers.get(socket.id);
    console.log(`❤️ ${user?.name || socket.id} liked partner`);
    
    const room = findUserRoom(socket.id);
    if (room) {
      const roomData = activeRooms.get(room);
      if (roomData) {
        const partnerId = roomData.users.find(id => id !== socket.id);
        if (partnerId) {
          io.to(partnerId).emit('partner-liked', {
            from: activeUsers.get(socket.id)
          });
        }
      }
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    console.log(`❌ User disconnected: ${user?.name || socket.id}`);
    
    // Remove from waiting queue
    const queueIndex = waitingQueue.findIndex(u => u.id === socket.id);
    if (queueIndex > -1) {
      waitingQueue.splice(queueIndex, 1);
      console.log(`➖ Removed from queue. New queue length: ${waitingQueue.length}`);
    }
    
    // Leave room and notify partner
    leaveCurrentRoom(socket.id);
    
    // Remove from active users
    activeUsers.delete(socket.id);
    
    // Broadcast updated online count
    const totalOnline = simulatedOnlineCount + activeUsers.size;
    io.emit('online-count', totalOnline);
    console.log(`📊 Updated online count: ${totalOnline}`);
  });
});

// Helper Functions
function matchUsers() {
  while (waitingQueue.length >= 2) {
    const user1 = waitingQueue.shift();
    const user2 = waitingQueue.shift();
    
    // Validate both users are still connected
    const socket1 = io.sockets.sockets.get(user1.id);
    const socket2 = io.sockets.sockets.get(user2.id);
    
    if (!socket1 || !socket2) {
      console.log('⚠️ One or both users disconnected during matching');
      if (socket1) waitingQueue.unshift(user1);
      if (socket2) waitingQueue.unshift(user2);
      continue;
    }
    
    const roomId = uuidv4();
    const room = {
      id: roomId,
      users: [user1.id, user2.id],
      createdAt: new Date()
    };
    
    activeRooms.set(roomId, room);
    
    // Join both users to the socket room
    socket1.join(roomId);
    socket2.join(roomId);
    
    // Notify both users of the match
    socket1.emit('partner-found', {
      partner: activeUsers.get(user2.id),
      roomId: roomId
    });
    
    socket2.emit('partner-found', {
      partner: activeUsers.get(user1.id),
      roomId: roomId
    });
    
    console.log(`✅ Successfully matched ${user1.name} with ${user2.name} in room ${roomId}`);
  }
}

function findUserRoom(userId) {
  for (const [roomId, room] of activeRooms) {
    if (room.users.includes(userId)) {
      return roomId;
    }
  }
  return null;
}

function leaveCurrentRoom(userId) {
  const roomId = findUserRoom(userId);
  if (roomId) {
    const room = activeRooms.get(roomId);
    if (room) {
      console.log(`🚪 User ${userId} leaving room ${roomId}`);
      
      // Notify partner about disconnect
      const partnerId = room.users.find(id => id !== userId);
      if (partnerId) {
        console.log(`📢 Notifying ${partnerId} about disconnect`);
        io.to(partnerId).emit('partner-disconnected');
      }
      
      // Remove users from socket room
      room.users.forEach(uid => {
        const socket = io.sockets.sockets.get(uid);
        if (socket) {
          socket.leave(roomId);
        }
      });
      
      activeRooms.delete(roomId);
      console.log(`🗑️ Room ${roomId} deleted`);
    }
  }
}

function getRandomLocation() {
  const locations = [
    'New York, USA', 'London, UK', 'Tokyo, Japan', 'Paris, France',
    'Sydney, Australia', 'Berlin, Germany', 'Toronto, Canada',
    'Mumbai, India', 'Seoul, South Korea', 'São Paulo, Brazil',
    'Moscow, Russia', 'Cairo, Egypt', 'Lagos, Nigeria', 'Mexico City, Mexico',
    'Buenos Aires, Argentina', 'Bangkok, Thailand', 'Istanbul, Turkey'
  ];
  return locations[Math.floor(Math.random() * locations.length)];
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 StreamConnect Backend Server');
  console.log(`📍 Running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS enabled for: ${process.env.CLIENT_URL || 'localhost:5173'}`);
  console.log(`👥 Simulated users online: ${simulatedOnlineCount}`);
  console.log('✅ Ready for connections!');
});

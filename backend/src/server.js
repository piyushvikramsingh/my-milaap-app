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
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store active users and rooms
const activeUsers = new Map();
const waitingQueue = [];
const activeRooms = new Map();

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    users: activeUsers.size,
    rooms: activeRooms.size,
    waiting: waitingQueue.length
  });
});

// Socket.IO Connection Handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // User joins the platform
  socket.on('join-platform', (userData) => {
    const user = {
      id: socket.id,
      name: userData.name || `User${Math.floor(Math.random() * 1000)}`,
      location: userData.location || 'Unknown',
      joinedAt: new Date()
    };
    
    activeUsers.set(socket.id, user);
    
    socket.emit('user-registered', user);
    
    // Broadcast online count
    io.emit('online-count', activeUsers.size);
  });

  // Find new partner
  socket.on('find-partner', () => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    // Remove from any existing room
    leaveCurrentRoom(socket.id);

    // Add to waiting queue if not already there
    if (!waitingQueue.find(u => u.id === socket.id)) {
      waitingQueue.push(user);
    }

    // Try to match with someone
    matchUsers();
  });

  // Send message in room
  socket.on('send-message', (data) => {
    const user = activeUsers.get(socket.id);
    const room = findUserRoom(socket.id);
    
    if (room && user) {
      const message = {
        id: uuidv4(),
        userId: socket.id,
        userName: user.name,
        content: data.content,
        timestamp: new Date(),
        type: 'text'
      };
      
      io.to(room).emit('new-message', message);
    }
  });

  // WebRTC signaling
  socket.on('webrtc-offer', (data) => {
    socket.to(data.target).emit('webrtc-offer', {
      offer: data.offer,
      sender: socket.id
    });
  });

  socket.on('webrtc-answer', (data) => {
    socket.to(data.target).emit('webrtc-answer', {
      answer: data.answer,
      sender: socket.id
    });
  });

  socket.on('webrtc-ice-candidate', (data) => {
    socket.to(data.target).emit('webrtc-ice-candidate', {
      candidate: data.candidate,
      sender: socket.id
    });
  });

  // Skip current partner
  socket.on('skip-partner', () => {
    const room = findUserRoom(socket.id);
    if (room) {
      const roomData = activeRooms.get(room);
      if (roomData) {
        // Notify partner about skip
        const partnerId = roomData.users.find(id => id !== socket.id);
        if (partnerId) {
          io.to(partnerId).emit('partner-skipped');
        }
      }
    }
    
    leaveCurrentRoom(socket.id);
    socket.emit('find-partner');
  });

  // Report partner
  socket.on('report-partner', (reason) => {
    const room = findUserRoom(socket.id);
    if (room) {
      const roomData = activeRooms.get(room);
      if (roomData) {
        const partnerId = roomData.users.find(id => id !== socket.id);
        console.log(`User ${socket.id} reported ${partnerId} for: ${reason}`);
        
        // Notify partner and disconnect
        if (partnerId) {
          io.to(partnerId).emit('partner-reported');
        }
      }
    }
    
    leaveCurrentRoom(socket.id);
    socket.emit('find-partner');
  });

  // Like partner
  socket.on('like-partner', () => {
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
    console.log(`User disconnected: ${socket.id}`);
    
    // Remove from waiting queue
    const queueIndex = waitingQueue.findIndex(u => u.id === socket.id);
    if (queueIndex > -1) {
      waitingQueue.splice(queueIndex, 1);
    }
    
    // Leave room and notify partner
    leaveCurrentRoom(socket.id);
    
    // Remove from active users
    activeUsers.delete(socket.id);
    
    // Broadcast updated online count
    io.emit('online-count', activeUsers.size);
  });
});

// Helper Functions
function matchUsers() {
  if (waitingQueue.length >= 2) {
    const user1 = waitingQueue.shift();
    const user2 = waitingQueue.shift();
    
    const roomId = uuidv4();
    const room = {
      id: roomId,
      users: [user1.id, user2.id],
      createdAt: new Date()
    };
    
    activeRooms.set(roomId, room);
    
    // Join both users to the room
    io.sockets.sockets.get(user1.id)?.join(roomId);
    io.sockets.sockets.get(user2.id)?.join(roomId);
    
    // Notify both users of the match
    io.to(user1.id).emit('partner-found', {
      partner: activeUsers.get(user2.id),
      roomId: roomId
    });
    
    io.to(user2.id).emit('partner-found', {
      partner: activeUsers.get(user1.id),
      roomId: roomId
    });
    
    console.log(`Matched ${user1.name} with ${user2.name}`);
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
      // Notify partner about disconnect
      const partnerId = room.users.find(id => id !== userId);
      if (partnerId) {
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
    }
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

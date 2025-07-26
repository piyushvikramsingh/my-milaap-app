# StreamConnect - Random Video Chat App

A modern, real-time video chat application inspired by Omegle/OmeTV with a sleek dark design.

## 🚀 Features

- **Real-time Video Chat** - WebRTC-powered peer-to-peer video calls
- **Instant Messaging** - Socket.IO real-time chat
- **Random Matching** - Intelligent partner pairing system
- **Mobile Responsive** - Perfect experience on all devices
- **Modern UI** - Dark theme with smooth animations
- **Safety Features** - Report, skip, and like system

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Socket.IO Client** for real-time communication
- **WebRTC** for video calling

### Backend
- **Node.js** with Express
- **Socket.IO** for real-time features
- **WebRTC signaling** server

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+
- Yarn package manager

### Frontend Setup
```bash
# Install dependencies
yarn install

# Start development server
yarn dev
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
yarn install

# Start backend server
yarn dev
```

## 🔧 Environment Setup

### Frontend (.env)
```env
VITE_BACKEND_URL=http://localhost:3001
```

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

## 📦 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variable: `VITE_BACKEND_URL=https://your-backend.com`
3. Deploy automatically

### Backend (Railway/Render)
1. Connect repository to Railway or Render
2. Set environment variables
3. Deploy with automatic builds

## 🏗️ Architecture

```
Frontend (React)
    ↓ Socket.IO
Backend (Node.js)
    ↓ WebRTC Signaling
Peer-to-Peer Video (WebRTC)
```

## 🔐 Security Features

- Report system for inappropriate behavior
- No personal data storage
- Peer-to-peer video (no server recording)
- Rate limiting on backend

## 🎯 Key Components

- **VideoFrame** - Handles video display and states
- **ChatSidebar** - Real-time messaging interface
- **ControlButtons** - Navigation and media controls
- **useSocketChat** - Real-time communication hook
- **useWebRTC** - Video calling functionality

## 📱 Mobile Features

- Responsive design
- Touch-friendly controls
- Optimized video layout
- Mobile chat overlay

## 🚦 Development Scripts

```bash
# Frontend
yarn dev          # Start development server
yarn build        # Build for production
yarn preview      # Preview production build

# Backend
yarn dev          # Start with nodemon
yarn start        # Start production server
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙋‍♂️ Support

For support, email support@streamconnect.com or create an issue.

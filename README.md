# 🎥 StreamConnect - Video Chat Application

A modern, real-time video chat application built with React, Node.js, Socket.IO, and WebRTC. Connect with random people worldwide through seamless video calls with crystal-clear audio and video quality.

![StreamConnect Demo](https://img.shields.io/badge/Status-Production_Ready-green)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![WebRTC](https://img.shields.io/badge/WebRTC-Enabled-orange)

## ✨ Features

### 🎯 Core Functionality
- **Real-time Video Chat**: High-quality video calls using WebRTC
- **Auto Matching**: Intelligent partner matching system
- **Instant Messaging**: Text chat during video calls
- **Camera/Microphone Controls**: Toggle audio and video on/off
- **Skip & Report**: Skip to next partner or report inappropriate behavior
- **Like System**: Express appreciation for good conversations

### 🚀 Technical Features
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Beautiful interface with smooth animations
- **HTTPS Ready**: Secure connections for production deployment
- **Error Recovery**: Automatic reconnection and fallback strategies
- **Performance Optimized**: Efficient WebRTC connection management
- **Cross-Platform**: Compatible with all modern browsers

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI framework
- **TypeScript** - Type safety and developer experience
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Socket.IO Client** - Real-time communication
- **Lucide React** - Beautiful icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **Socket.IO** - WebSocket implementation for real-time communication
- **WebRTC** - Peer-to-peer video/audio communication
- **CORS** - Cross-origin resource sharing
- **UUID** - Unique identifier generation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Modern web browser with WebRTC support

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd streamconnect
   ```

2. **Install dependencies**
   ```bash
   # Frontend dependencies
   npm install
   
   # Backend dependencies
   cd backend
   npm install
   cd ..
   ```

3. **Create environment files**
   ```bash
   # Frontend environment
   cp .env.example .env
   
   # Backend environment
   cp backend/.env.example backend/.env
   ```

4. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   npm run dev
   ```

5. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## 🌐 Deployment Options

### 🎯 Recommended: Railway + Vercel

**Perfect for production with HTTPS, scalability, and reliability.**

#### Backend on Railway
1. Create account at [Railway](https://railway.app)
2. Connect your GitHub repository
3. Select the `backend` folder for deployment
4. Set environment variables:
   ```
   NODE_ENV=production
   PORT=3001
   CLIENT_URL=https://your-frontend-domain.vercel.app
   ```
5. Deploy and note the backend URL

#### Frontend on Vercel
1. Create account at [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Set environment variable:
   ```
   VITE_BACKEND_URL=https://your-backend-domain.railway.app
   ```
4. Deploy

### 🏢 Enterprise: Render

**Full-stack deployment with automatic SSL and monitoring.**

1. Connect repository to [Render](https://render.com)
2. Create Blueprint deployment using `deployment/render.yaml`
3. Services are automatically configured and linked

### 🐳 Self-Hosted: Docker

**Complete control with Docker containers.**

```bash
# Quick deployment
./deploy.sh

# Or manually
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 📚 More Options

See detailed deployment guides in [`deployment/README.md`](deployment/README.md) for:
- Netlify + Railway
- AWS/GCP/Azure
- Custom domain setup
- SSL certificate configuration

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```bash
VITE_BACKEND_URL=http://localhost:3001  # Backend URL
```

#### Backend (backend/.env)
```bash
NODE_ENV=development                    # Environment
PORT=3001                              # Server port
CLIENT_URL=http://localhost:5173       # Frontend URL for CORS
```

### Advanced Configuration

#### WebRTC STUN Servers
Configured in `src/hooks/useWebRTC.ts`:
```javascript
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // Add custom STUN/TURN servers for better connectivity
];
```

#### Socket.IO Configuration
Configured in `backend/src/server.js`:
```javascript
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true
  }
});
```

## 🧪 Testing

### Manual Testing
1. Open two browser tabs/windows
2. Allow camera/microphone access
3. Both users should be automatically matched
4. Test video, audio, chat, and controls

### Automated Testing
```bash
# Frontend tests
npm run test

# Backend tests
cd backend && npm run test

# E2E tests
npm run test:e2e
```

## 🐛 Troubleshooting

### Common Issues

#### Camera/Microphone Not Working
- ✅ Ensure HTTPS is enabled (required for WebRTC)
- ✅ Check browser permissions
- ✅ Verify camera/microphone aren't used by other apps

#### Connection Issues
- ✅ Check CORS configuration matches frontend URL exactly
- ✅ Verify backend health endpoint: `/api/health`
- ✅ Check network connectivity between services

#### Build Failures
- ✅ Ensure Node.js 18+ is installed
- ✅ Clear node_modules and reinstall dependencies
- ✅ Check for TypeScript errors

### Debug Mode
Enable detailed logging:
```bash
# Frontend
localStorage.setItem('debug', 'socket.io-client:*')

# Backend
DEBUG=socket.io:* npm run dev
```

### Health Checks
- **Backend**: `GET /api/health`
- **Frontend**: `GET /health` (nginx)
- **Full Stack**: `GET /api/stats`

## 📈 Performance & Scaling

### Production Optimizations
- **CDN**: Use CloudFlare for static assets
- **Load Balancing**: Multiple backend instances
- **Redis**: Session store for horizontal scaling  
- **Database**: PostgreSQL for user data and analytics
- **Monitoring**: Error tracking with Sentry

### Browser Support
- Chrome 80+
- Firefox 75+
- Safari 13.1+
- Edge 80+

## 🔒 Security

### Built-in Security Features
- **HTTPS Enforcement**: Required for WebRTC
- **CORS Protection**: Configured for specific origins
- **Security Headers**: XSS, CSRF, and clickjacking protection
- **Input Validation**: Sanitized user inputs
- **Rate Limiting**: API endpoint protection

### Additional Security (Production)
- Implement user authentication
- Add content moderation
- Set up IP-based rate limiting
- Enable security monitoring

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md).

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Style
- ESLint for JavaScript/TypeScript
- Prettier for code formatting
- Conventional Commits for git messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **WebRTC**: For enabling peer-to-peer communication
- **Socket.IO**: For real-time websocket connections
- **React Team**: For the amazing frontend framework
- **Vercel & Railway**: For excellent deployment platforms

## 📞 Support

### Getting Help
- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](issues/)
- 💬 [Discussions](discussions/)
- 📧 Email: support@streamconnect.app

### Status Page
Check service status: [status.streamconnect.app](https://status.streamconnect.app)

---

<div align="center">

**[🌐 Live Demo](https://streamconnect.vercel.app)** | 
**[📚 Documentation](docs/)** | 
**[🚀 Deploy Now](deployment/)**

Made with ❤️ by the StreamConnect team

</div>

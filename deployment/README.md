# StreamConnect Deployment Guide

This guide covers multiple deployment options for the StreamConnect video chat application.

## Quick Deploy Options

### Option 1: Railway + Vercel (Recommended)

**Backend on Railway:**
1. Fork this repository
2. Connect your GitHub account to [Railway](https://railway.app)
3. Create a new project and select the backend folder
4. Railway will automatically detect the Dockerfile
5. Set environment variables:
   - `NODE_ENV=production`
   - `PORT=3001`
   - `CLIENT_URL=https://your-frontend-domain.vercel.app`
6. Deploy and note the backend URL

**Frontend on Vercel:**
1. Connect your GitHub account to [Vercel](https://vercel.com)
2. Import your repository
3. Set the root directory to the project root
4. Set environment variable:
   - `VITE_BACKEND_URL=https://your-backend-domain.railway.app`
5. Deploy

### Option 2: Render (Full Stack)

1. Fork this repository
2. Connect your GitHub account to [Render](https://render.com)
3. Create a new "Blueprint" and upload the `render.yaml` file
4. Render will create both frontend and backend services automatically
5. Update the service URLs in the configuration as needed

### Option 3: Netlify + Railway

**Backend on Railway:** (Same as Option 1)

**Frontend on Netlify:**
1. Connect your GitHub account to [Netlify](https://netlify.com)
2. Import your repository
3. Set build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Set environment variable:
   - `VITE_BACKEND_URL=https://your-backend-domain.railway.app`
5. Deploy

### Option 4: Docker Compose (Self-Hosted)

```bash
# Clone the repository
git clone <your-repo-url>
cd streamconnect

# Create environment files
cp .env.example .env
cp backend/.env.example backend/.env

# Update environment variables in both files
# Set VITE_BACKEND_URL=http://your-domain:3001 in .env
# Set CLIENT_URL=http://your-domain in backend/.env

# Build and run
docker-compose up -d

# Check status
docker-compose ps
```

## Environment Variables

### Frontend (.env)
```
VITE_BACKEND_URL=https://your-backend-domain.com
```

### Backend (backend/.env)
```
NODE_ENV=production
PORT=3001
CLIENT_URL=https://your-frontend-domain.com
```

## HTTPS Requirements

**Important:** WebRTC requires HTTPS in production for camera/microphone access. All recommended platforms (Railway, Vercel, Render, Netlify) provide HTTPS by default.

## Custom Domain Setup

1. **Backend:** Configure your custom domain in Railway/Render dashboard
2. **Frontend:** Add custom domain in Vercel/Netlify dashboard
3. **Update Environment Variables:** Update CORS and API URLs accordingly

## Troubleshooting

### Common Issues:

1. **CORS Errors:** Ensure `CLIENT_URL` in backend matches your frontend domain exactly
2. **Camera/Mic Not Working:** Verify HTTPS is enabled
3. **Connection Issues:** Check that backend health endpoint (`/api/health`) is accessible
4. **Build Failures:** Ensure Node.js version 18+ is used

### Health Checks:

- **Backend:** `GET /api/health`
- **Frontend:** `GET /health` (nginx endpoint)

### Logs:

- **Railway:** View logs in Railway dashboard
- **Vercel:** Check function logs in Vercel dashboard
- **Render:** Monitor logs in Render dashboard

## Scaling Considerations

For production use, consider:

1. **Redis Session Store:** Add Redis for session management
2. **Load Balancing:** Use multiple backend instances
3. **CDN:** Implement CloudFlare or similar for static assets
4. **Monitoring:** Add error tracking (Sentry) and analytics
5. **Rate Limiting:** Implement rate limiting for API endpoints

## Security Notes

- HTTPS is enforced for WebRTC functionality
- CORS is configured for cross-origin requests
- Security headers are set in nginx configuration
- No sensitive data is stored in localStorage

## Support

For deployment issues, check:
1. Platform-specific documentation
2. Environment variable configuration
3. Network connectivity between frontend and backend
4. Browser console for WebRTC errors
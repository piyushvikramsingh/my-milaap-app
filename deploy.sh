#!/bin/bash

# StreamConnect Deployment Script
echo "🚀 StreamConnect Deployment Script"
echo "=================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Function to create environment files
create_env_files() {
    echo "📝 Creating environment files..."
    
    # Frontend .env
    if [ ! -f .env ]; then
        echo "VITE_BACKEND_URL=http://localhost:3001" > .env
        echo "✅ Created frontend .env file"
    else
        echo "⚠️  Frontend .env already exists"
    fi
    
    # Backend .env
    if [ ! -f backend/.env ]; then
        cat > backend/.env << EOF
NODE_ENV=production
PORT=3001
CLIENT_URL=http://localhost
EOF
        echo "✅ Created backend .env file"
    else
        echo "⚠️  Backend .env already exists"
    fi
}

# Function to build and start services
deploy_services() {
    echo "🔨 Building and starting services..."
    
    # Stop any existing containers
    docker-compose down
    
    # Build and start services
    docker-compose up --build -d
    
    if [ $? -eq 0 ]; then
        echo "✅ Services started successfully!"
        echo ""
        echo "🌐 Frontend: http://localhost"
        echo "🔗 Backend: http://localhost:3001"
        echo "🩺 Health Check: http://localhost:3001/api/health"
        echo ""
        echo "📊 Check status with: docker-compose ps"
        echo "📄 View logs with: docker-compose logs -f"
        echo "🛑 Stop services with: docker-compose down"
    else
        echo "❌ Failed to start services"
        echo "📄 Check logs with: docker-compose logs"
        exit 1
    fi
}

# Function to check service health
check_health() {
    echo "🩺 Checking service health..."
    
    # Wait for services to start
    sleep 10
    
    # Check backend health
    if curl -s http://localhost:3001/api/health > /dev/null; then
        echo "✅ Backend is healthy"
    else
        echo "❌ Backend health check failed"
        return 1
    fi
    
    # Check frontend health
    if curl -s http://localhost/health > /dev/null; then
        echo "✅ Frontend is healthy"
    else
        echo "❌ Frontend health check failed"
        return 1
    fi
    
    echo "🎉 All services are healthy!"
}

# Main deployment flow
main() {
    create_env_files
    deploy_services
    
    if [ "$1" = "--check-health" ]; then
        check_health
    fi
}

# Parse command line arguments
case "$1" in
    "stop")
        echo "🛑 Stopping services..."
        docker-compose down
        echo "✅ Services stopped"
        ;;
    "logs")
        echo "📄 Showing logs..."
        docker-compose logs -f
        ;;
    "status")
        echo "📊 Service status:"
        docker-compose ps
        ;;
    "restart")
        echo "🔄 Restarting services..."
        docker-compose restart
        echo "✅ Services restarted"
        ;;
    "clean")
        echo "🧹 Cleaning up..."
        docker-compose down -v --rmi all
        echo "✅ Cleanup complete"
        ;;
    *)
        main "$@"
        ;;
esac
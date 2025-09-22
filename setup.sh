#!/bin/bash

# Warframe Market Analytics Setup Script
# This script helps set up the development environment

echo "🚀 Setting up Warframe Market Analytics..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js $(node -v) is installed"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

print_success "npm $(npm -v) is installed"

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    print_warning "MongoDB doesn't appear to be running. Make sure to start MongoDB before running the application."
else
    print_success "MongoDB is running"
fi

# Install dependencies
print_status "Installing backend dependencies..."
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install backend dependencies"
    exit 1
fi

print_success "Backend dependencies installed"

# Install frontend dependencies
print_status "Installing frontend dependencies..."
cd app
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install frontend dependencies"
    exit 1
fi

cd ..
print_success "Frontend dependencies installed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating .env file from template..."
    cp .env.example .env
    print_success ".env file created. Please edit it with your configuration."
    print_warning "Don't forget to configure your MongoDB URI and other settings in .env"
else
    print_success ".env file already exists"
fi

# Create proxy directories
print_status "Creating proxy directories..."
mkdir -p proxies
touch proxies/banned.txt
touch proxies/usa_banned.txt
touch proxies/idx.txt

print_success "Proxy directories created"
print_warning "Note: You'll need to create proxies/proxies.txt and proxies/usa_proxies.txt manually if using proxies"

# Build the application
print_status "Building the application..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Failed to build the application"
    exit 1
fi

print_success "Application built successfully"

echo ""
print_success "🎉 Setup completed successfully!"
echo ""
print_status "Next steps:"
echo "1. Edit the .env file with your configuration"
echo "2. Make sure MongoDB is running"
echo "3. Run 'npm run sync_items' to initialize the database"
echo "4. Run 'npm run dev' to start the development server"
echo "5. Run 'cd app && npm run dev' to start the frontend"
echo ""
print_status "For production deployment, use 'npm run pm2:start'"
echo ""
print_status "Visit the README.md for detailed documentation"

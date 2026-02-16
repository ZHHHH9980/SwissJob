#!/bin/bash

# SwissJob Setup Script
# This script automates the installation process

set -e  # Exit on error

echo "🔧 Setting up SwissJob..."
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Install Node dependencies
echo "📦 Installing Node.js dependencies..."
npm install
echo "✅ Node.js dependencies installed"
echo ""

# Setup environment variables
echo "⚙️  Setting up environment variables..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env (please add your API keys)"
else
    echo "✅ .env already exists"
fi
echo ""

# Initialize database
echo "🗄️  Initializing database..."
cd frontend
npx prisma generate
npx prisma db push
cd ..
echo "✅ Database initialized"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "To start the application, run:"
echo "  npm run dev"
echo ""
echo "The app will be available at:"
echo "  http://localhost:3000"
echo ""
echo "⚠️  Don't forget to add your API keys to .env"

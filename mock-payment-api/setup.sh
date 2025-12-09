#!/bin/bash

echo "🚀 Dummy Payment API Setup Script"
echo "================================="

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup database
echo "🗄️ Setting up database..."
echo "Enter MySQL root password:"
mysql -u root -p < database/schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database setup complete!"
else
    echo "❌ Database setup failed. Please check your MySQL credentials."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your MySQL password"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the server:"
echo "  npm start"
echo ""
echo "To run in development mode:"
echo "  npm run dev"
echo ""
echo "Test API Key: test-api-key-123"
echo "API Documentation: See README.md"

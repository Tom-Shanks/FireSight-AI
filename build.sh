#!/bin/bash

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install

# Build frontend
echo "Building frontend..."
npm run build

# Create necessary directories if they don't exist
mkdir -p ../public

# Copy frontend build to public directory
echo "Copying frontend build to public directory..."
cp -r build/* ../public/

# Copy 404.html to ensure it's available
cp build/404.html ../public/

# Return to root directory
cd ..

# Install API dependencies
echo "Installing API dependencies..."
cd api
npm install
cd ..

echo "Build completed successfully!" 
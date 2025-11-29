#!/bin/bash
# Plesk Git deployment script
# This runs after files are deployed to the server

echo "=== Starting deployment ==="

# Navigate to server directory
cd server || exit 1

# Install production dependencies
echo "Installing dependencies..."
npm install --production

# Copy .env.example to .env if .env doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  IMPORTANT: Edit /httpdocs/api/server/.env with your production credentials!"
fi

echo "=== Deployment complete ==="
echo "Remember to restart the Node.js application in Plesk!"

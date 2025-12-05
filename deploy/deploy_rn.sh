#!/bin/bash

# Configuration
NEW_RELEASE_DIR="/var/www/apps/source_code/antz_web/releases/initial_release"
ENVIRONMENT="jn"

# Check if credentials are provided via environment variables
if [ -z "$GIT_USERNAME" ] || [ -z "$GIT_PASSWORD" ]; then
  echo "❌ Error: GIT_USERNAME and GIT_PASSWORD environment variables must be set"
  echo "Usage: GIT_USERNAME=user GIT_PASSWORD=pass ./deploy/deploy_rn.sh"
  exit 1
fi

echo "========================================="
echo "🚀 Starting Deployment Process"
echo "========================================="
echo "Environment: $ENVIRONMENT"
echo "Release Directory: $NEW_RELEASE_DIR"
echo "========================================="

# Navigate to release directory
cd $NEW_RELEASE_DIR

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull

# Setup environment
echo "⚙️  Setting up environment..."
cp env.jn .env

# Build Next.js application
echo "🔨 Building Next.js application..."
npm run build

# Deploy all React dashboards
echo "📦 Deploying React dashboards..."
./deploy/deploy-react-dashboard-auth.sh "$GIT_USERNAME" "$GIT_PASSWORD" "$ENVIRONMENT" "$NEW_RELEASE_DIR"

# Check if dashboard deployment was successful
if [ $? -ne 0 ]; then
  echo "❌ Dashboard deployment failed!"
  exit 1
fi

# Restart PM2
echo ""
echo "🔄 Restarting Next.js application with PM2..."
cd "$NEW_RELEASE_DIR"
pm2 kill
pm2 start npm --name "antz_web" -- start

echo ""
echo "========================================="
echo "✅ Deployment Complete!"
echo "========================================="
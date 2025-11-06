#!/bin/bash

# Standalone React Dashboard Deployment Script
# Called from Next.js deploy.sh
# Usage: ./deploy-react-dashboard.sh <branch> <environment> <nextjs-app-dir>
# Example: ./deploy-react-dashboard.sh dev development /var/www/apps/antz_web

set -e  # Exit on any error

# Parse arguments - handle both 2 and 3 argument cases
if [ $# -eq 2 ]; then
  # 2 arguments: environment nextjs-dir (branch defaults to main)
  BRANCH="main"
  ENVIRONMENT=$1
  NEXTJS_APP_DIR=$2
elif [ $# -eq 3 ]; then
  # 3 arguments: branch environment nextjs-dir
  BRANCH=$1
  ENVIRONMENT=$2
  NEXTJS_APP_DIR=$3
else
  echo "❌ Usage: ./deploy-react-dashboard.sh <environment> <nextjs-app-dir>"
  echo "   Or: ./deploy-react-dashboard.sh <branch> <environment> <nextjs-app-dir>"
  echo ""
  echo "Examples:"
  echo "  ./deploy-react-dashboard.sh production /var/www/apps/source-code/antz_web"
  echo "  ./deploy-react-dashboard.sh dev development /var/www/apps/source-code/antz_web"
  exit 1
fi

echo ""
echo "========================================="
echo "🎨 React Dashboard Deployment"
echo "========================================="
echo "Branch: $BRANCH"
echo "Environment: $ENVIRONMENT"
echo "Next.js Directory: $NEXTJS_APP_DIR"
echo "========================================="

# Configuration
REACT_REPO="git@github.com:Antz-Ai-Dashboards/antz-key-insights.git"

# Target directory (inside Next.js public folder)
REACT_WEB_DIR="$NEXTJS_APP_DIR/current/public/reports/keyinsights"

echo "📍 Target: $REACT_WEB_DIR"

# Load NVM
export NVM_DIR=~/.nvm
if [ -s "$NVM_DIR/nvm.sh" ]; then
  source "$NVM_DIR/nvm.sh"
fi

# Create temporary build directory
TEMP_BUILD_DIR="/tmp/react-dashboard-build-$(date +%s)"
echo "📁 Creating temporary build directory: $TEMP_BUILD_DIR"
mkdir -p "$TEMP_BUILD_DIR"

# Clone repository to temp directory
echo "📥 Cloning repository..."
git clone --depth 1 -b "$BRANCH" "$REACT_REPO" "$TEMP_BUILD_DIR"

cd "$TEMP_BUILD_DIR"

# Setup environment file
echo "⚙️  Configuring environment: $ENVIRONMENT"
REACT_ENV_FILE=".env.antz.$ENVIRONMENT"

if [ ! -f "$REACT_ENV_FILE" ]; then
  echo "❌ Error: Environment file $REACT_ENV_FILE not found"
  echo "Available files:"
  ls -la .env.antz.* 2>/dev/null || echo "No .env.antz.* files found"
  exit 1
fi

cp "$REACT_ENV_FILE" .env
cp "$REACT_ENV_FILE" .env.production

# Update VITE_OUT_DIR to build locally
sed -i.bak "s|^VITE_OUT_DIR=.*|VITE_OUT_DIR=dist|" .env
sed -i.bak "s|^VITE_OUT_DIR=.*|VITE_OUT_DIR=dist|" .env.production
rm -f .env.bak .env.production.bak

echo "📋 Environment file: $REACT_ENV_FILE"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build
echo "🔨 Building React dashboard..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "✅ Build successful!"

# Create target directory
echo "📂 Preparing deployment directory..."
mkdir -p "$REACT_WEB_DIR"

# Clear old files
echo "🗑️  Clearing old files from $REACT_WEB_DIR"
rm -rf "$REACT_WEB_DIR"/*

# Copy new build
echo "📋 Copying build files..."
cp -r dist/* "$REACT_WEB_DIR/"

# Clean up temporary build directory immediately after copy
echo "🧹 Cleaning up temporary build directory..."
cd /
rm -rf "$TEMP_BUILD_DIR"

# Set permissions
echo "🔒 Setting permissions..."
chown -R www-data:www-data "$REACT_WEB_DIR" 2>/dev/null || true
chmod -R 755 "$REACT_WEB_DIR"

echo ""
echo "========================================="
echo "✅ React Dashboard Deployed Successfully!"
echo "========================================="
echo "Branch: $BRANCH"
echo "Environment: $ENVIRONMENT"
echo "Deployed to: $REACT_WEB_DIR"
echo "========================================="

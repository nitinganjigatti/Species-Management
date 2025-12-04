#!/bin/bash

# Multi-Repository React Dashboard Deployment Script with Auth
# Called from Next.js deploy.sh
# Usage: ./deploy-react-dashboard-auth.sh <username> <password> <branch> <environment> <nextjs-app-dir>
# Example: ./deploy-react-dashboard-auth.sh myuser mypass dev development /var/www/apps/antz_web

set -e  # Exit on any error

# ========================================
# REPOSITORY CONFIGURATION
# Add new repositories here with their destination paths
# Format: "https_repository_url|destination_path"
# NOTE: Use HTTPS URLs (not SSH) for authentication
# ========================================
declare -a DEPLOYMENTS=(
  "https://github.com/Antz-Ai-Dashboards/antz-key-insights.git|public/reports/keyinsights"
  "https://github.com/Antz-Ai-Dashboards/antz-user-dashboard.git|public/reports/users"
  # Add more repositories here as needed
  # "https://github.com/Antz-Ai-Dashboards/another-dashboard.git|public/reports/another"
)

# Parse arguments - require username and password
if [ $# -eq 4 ]; then
  # 4 arguments: username password environment nextjs-dir (branch defaults to main)
  GIT_USERNAME=$1
  GIT_PASSWORD=$2
  BRANCH="main"
  ENVIRONMENT=$3
  NEXTJS_APP_DIR=$4
elif [ $# -eq 5 ]; then
  # 5 arguments: username password branch environment nextjs-dir
  GIT_USERNAME=$1
  GIT_PASSWORD=$2
  BRANCH=$3
  ENVIRONMENT=$4
  NEXTJS_APP_DIR=$5
else
  echo "❌ Usage: ./deploy-react-dashboard-auth.sh <username> <password> <environment> <nextjs-app-dir>"
  echo "   Or: ./deploy-react-dashboard-auth.sh <username> <password> <branch> <environment> <nextjs-app-dir>"
  echo ""
  echo "Examples:"
  echo "  ./deploy-react-dashboard-auth.sh myuser mypass production /var/www/apps/source-code/antz_web"
  echo "  ./deploy-react-dashboard-auth.sh myuser mypass dev development /var/www/apps/source-code/antz_web"
  exit 1
fi

echo ""
echo "========================================="
echo "🎨 Multi-Dashboard Deployment (Auth)"
echo "========================================="
echo "Username: $GIT_USERNAME"
echo "Branch: $BRANCH"
echo "Environment: $ENVIRONMENT"
echo "Next.js Directory: $NEXTJS_APP_DIR"
echo "Total Dashboards: ${#DEPLOYMENTS[@]}"
echo "========================================="

# URL encode username and password for git
ENCODED_USERNAME=$(printf %s "$GIT_USERNAME" | jq -sRr @uri)
ENCODED_PASSWORD=$(printf %s "$GIT_PASSWORD" | jq -sRr @uri)

# Load NVM
export NVM_DIR=~/.nvm
if [ -s "$NVM_DIR/nvm.sh" ]; then
  source "$NVM_DIR/nvm.sh"
fi

# Track deployment results
SUCCESSFUL_DEPLOYMENTS=0
FAILED_DEPLOYMENTS=0
declare -a DEPLOYMENT_RESULTS=()

# Function to deploy a single dashboard
deploy_dashboard() {
  local REPO_BASE=$1
  local DEST_PATH=$2
  local REPO_NAME=$(basename "$REPO_BASE" .git)

  # Build authenticated URL by injecting credentials
  local REPO_URL="https://${ENCODED_USERNAME}:${ENCODED_PASSWORD}@${REPO_BASE#https://}"

  echo ""
  echo "========================================="
  echo "📦 Deploying: $REPO_NAME"
  echo "========================================="
  echo "Repository: $REPO_BASE"
  echo "Destination: $DEST_PATH"
  echo "========================================="

  # Full target directory path
  local REACT_WEB_DIR="$NEXTJS_APP_DIR/$DEST_PATH"
  echo "📍 Full Target: $REACT_WEB_DIR"

  # Create temporary build directory
  local TEMP_BUILD_DIR="/tmp/ai-dashboard/$REPO_NAME-build-$(date +%s)"
  echo "📁 Creating temporary build directory: $TEMP_BUILD_DIR"
  mkdir -p "$TEMP_BUILD_DIR"

  # Clone repository to temp directory
  echo "📥 Cloning repository..."
  if ! git clone --depth 1 -b "$BRANCH" "$REPO_URL" "$TEMP_BUILD_DIR" 2>&1 | grep -v "Password"; then
    echo "❌ Failed to clone repository: $REPO_NAME"
    rm -rf "$TEMP_BUILD_DIR"
    return 1
  fi

  cd "$TEMP_BUILD_DIR"

  # Setup environment file
  echo "⚙️  Configuring environment: $ENVIRONMENT"
  local REACT_ENV_FILE=".env.antz.$ENVIRONMENT"

  if [ ! -f "$REACT_ENV_FILE" ]; then
    echo "❌ Error: Environment file $REACT_ENV_FILE not found in $REPO_NAME"
    echo "Available files:"
    ls -la .env.antz.* 2>/dev/null || echo "No .env.antz.* files found"
    cd /
    rm -rf "$TEMP_BUILD_DIR"
    return 1
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
  if ! npm install; then
    echo "❌ Failed to install dependencies for $REPO_NAME"
    cd /
    rm -rf "$TEMP_BUILD_DIR"
    return 1
  fi

  # Build
  echo "🔨 Building React dashboard..."
  if ! npm run build; then
    echo "❌ Build failed for $REPO_NAME"
    cd /
    rm -rf "$TEMP_BUILD_DIR"
    return 1
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

  echo "✅ $REPO_NAME deployed successfully to $REACT_WEB_DIR"
  return 0
}

# Loop through all configured deployments
for deployment in "${DEPLOYMENTS[@]}"; do
  # Split the configuration into repo and destination
  IFS='|' read -r REPO_BASE DEST_PATH <<< "$deployment"

  REPO_NAME=$(basename "$REPO_BASE" .git)

  # Deploy the dashboard
  if deploy_dashboard "$REPO_BASE" "$DEST_PATH"; then
    SUCCESSFUL_DEPLOYMENTS=$((SUCCESSFUL_DEPLOYMENTS + 1))
    DEPLOYMENT_RESULTS+=("✅ $REPO_NAME")
  else
    FAILED_DEPLOYMENTS=$((FAILED_DEPLOYMENTS + 1))
    DEPLOYMENT_RESULTS+=("❌ $REPO_NAME")
  fi
done

# Final summary
echo ""
echo "========================================="
echo "📊 DEPLOYMENT SUMMARY"
echo "========================================="
echo "Total Dashboards: ${#DEPLOYMENTS[@]}"
echo "Successful: $SUCCESSFUL_DEPLOYMENTS"
echo "Failed: $FAILED_DEPLOYMENTS"
echo ""
echo "Results:"
for result in "${DEPLOYMENT_RESULTS[@]}"; do
  echo "  $result"
done
echo "========================================="

# Exit with error if any deployment failed
if [ $FAILED_DEPLOYMENTS -gt 0 ]; then
  echo ""
  echo "⚠️  Some deployments failed. Please check the logs above."
  exit 1
fi

echo ""
echo "✅ All dashboards deployed successfully!"
exit 0

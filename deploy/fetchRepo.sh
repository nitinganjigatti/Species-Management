#!/bin/bash

# any future command that fails will exit the script
set -e

BRANCH=$1
ENV_TO_LOAD=$2
GITHUB_RUN_ID=$3
ANTZ_DEPLOYMENT_TOKEN=$4
GITHUB_WORKFLOW=$5
GITHUB_REPOSITORY="ANTZ-Systems/antz_web_dashboard"

echo $BRANCH
REPO="git@github.com:ANTZ-Systems/antz_web_dashboard.git"
#APP_DIR="/var/www/app"
APP_DIR="/var/www/apps/source-code/antz_web"
RELEASES_DIR=$APP_DIR"/releases"
CURRENT_RELEASE=$APP_DIR"/current"
NEW_RELEASE=$(date +"%Y%m%d%H%M%S")
NEW_RELEASE_DIR=$RELEASES_DIR/$NEW_RELEASE

export NVM_DIR=~/.nvm
source ~/.nvm/nvm.sh

# CREATE APP DIRECTORIES FOR THE FIRST TIME
[ -d $APP_DIR ] || mkdir -p $APP_DIR
[ -d $RELEASES_DIR ] || mkdir -p $RELEASES_DIR
#[ -d $CURRENT_RELEASE ] || mkdir -p $CURRENT_RELEASE

if [ ! -d $CURRENT_RELEASE ]; then
  echo "$CURRENT_RELEASE is empty. Initialize"
  sudo mkdir -p $RELEASES_DIR"/initial_release"
  sudo chmod  o+w $RELEASES_DIR"/initial_release"
  echo "git clone --depth 1 -b $BRANCH $REPO $RELEASES_DIR/initial_release"
  git clone --depth 1 -b $BRANCH $REPO $RELEASES_DIR"/initial_release"
  echo "NEW DIRECTORY $RELEASES_DIR/initial_release"
  echo "CURRENT DIRECTORY $CURRENT_RELEASE"

  sudo ln -nfs $RELEASES_DIR"/initial_release" $CURRENT_RELEASE
fi


echo "Cloning repository"

[ -d $NEW_RELEASE_DIR ] || sudo mkdir -p $NEW_RELEASE_DIR
sudo chmod  o+w $NEW_RELEASE_DIR
git clone --depth 1 -b $BRANCH $REPO $NEW_RELEASE_DIR

# mkdir -p $NEW_RELEASE_DIR/uploads/user-qr
# sudo chown -R www-data:www-data $NEW_RELEASE_DIR
cd $NEW_RELEASE_DIR
# sudo apt-get install -y curl jq

rm -f .env;
# vantara-prod
if [ $ENV_TO_LOAD == 'development' ]
then
  cp -r env.development .env
elif [ $ENV_TO_LOAD == 'uat' ]
then
  cp -r env.uat .env
elif [ $ENV_TO_LOAD == 'production' ]
then
  cp -r env.production .env
elif [ $ENV_TO_LOAD == 'farm' ]
then
  cp -r env.farm .env
fi


# node -v
npm -v
nvm -v

# Update node-gyp to latest
# npm install --global node-gyp@latest
# npm config set node_gyp $(npm prefix -g)/lib/node_modules/node-gyp/bin/node-gyp.js

echo "Running npm install:"; pwd
#rm -rf node_modules
#rm package-lock.json
#npm update
#npm install --legacy-peer-deps
npm install --production
#### BACKUP the existing FOLDER as ZIP(SITE FOLDER)

#Create build
# echo "Running npm build"
# npm run build


echo "Downloading artifact"

# Download the artifact using artifact name and workflow run ID (replace placeholders)
ARTIFACT_NAME="nextjs-build-output"  # Replace with the name from your workflow

echo $GITHUB_RUN_ID
echo $ANTZ_DEPLOYMENT_TOKEN
echo $GITHUB_WORKFLOW
echo $GITHUB_REPOSITORY
# Get the artifact URL
echo "https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}/artifacts";


ARTIFACTS_RESPONSE=$(curl -s -H "Authorization: Bearer $ANTZ_DEPLOYMENT_TOKEN" \
    -w "%{http_code}" \
    "https://api.github.com/repos/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID/artifacts")

# Extract HTTP status code
HTTP_STATUS=$(echo "$ARTIFACTS_RESPONSE" | tail -n1)
ARTIFACTS_JSON=$(echo "$ARTIFACTS_RESPONSE" | head -n-1)

echo "Artifacts response: $ARTIFACTS_JSON"
ARTIFACT_URL=$(echo $ARTIFACTS_JSON | jq -r ".artifacts[] | select(.name == \"$ARTIFACT_NAME\") | .archive_download_url")


# Debugging: Print the artifact URL
echo "Artifact URL: $ARTIFACT_URL"

if [ -z "$ARTIFACT_URL" ]; then
  echo "Artifact URL not found. Please check the artifact name and run ID."
  exit 1
fi

# Download the artifact
curl -L -H "Authorization: Bearer $ANTZ_DEPLOYMENT_TOKEN" \
    -o $ARTIFACT_NAME.zip \
    $ARTIFACT_URL

# Unzip the artifact
unzip $ARTIFACT_NAME.zip -d .next
rm -rf $ARTIFACT_NAME.zip
ls -la


process_name="antz-web"

echo "Stopping PM2 Service: $process_name"

# Check if the process is running
if pm2 list | grep -q $process_name; then
    # If running, delete the process
    pm2 delete $process_name
    echo "PM2 process $process_name stopped."
else
    echo "PM2 process $process_name is not running."
fi

pm2 start npm --name "$process_name" -- start
sudo ln -nfs $NEW_RELEASE_DIR $CURRENT_RELEASE
echo "Deployed. DONE!!!"

#  DELETE ALL FOLDERS EXCEPT LAST 5 releases
if [ -n "$(ls -dt $RELEASES_DIR/*/ | tail -n +6)" ]; then
    ls -dt $RELEASES_DIR/*/ | tail -n +6 | xargs sudo rm -r
else
    echo "No directories to remove."
fi

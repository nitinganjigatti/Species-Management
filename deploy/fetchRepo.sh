#!/bin/bash

# any future command that fails will exit the script
set -e

BRANCH=$1
ENV_TO_LOAD=$2
echo $BRANCH
REPO="git@github.com:ANTZ-Systems/antz_web_dashboard.git"
#APP_DIR="/var/www/app"
APP_DIR="/var/www/apps/source-code/web"
RELEASES_DIR=$APP_DIR"/releases"
CURRENT_RELEASE=$APP_DIR"/current"
NEW_RELEASE=$(date +"%Y%m%d%H%M%S")
NEW_RELEASE_DIR=$RELEASES_DIR/$NEW_RELEASE

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
sudo ln -nfs $NEW_RELEASE_DIR $CURRENT_RELEASE

rm -f .env;
if [ $ENV_TO_LOAD == 'development' ]
then
  cp -r .env.development .env
elif [ $ENV_TO_LOAD == 'staging' ]
then
  cp -r .env.staging .env
elif [ $ENV_TO_LOAD == 'production' ]
then
  cp -r .env.production .env
fi


node -v
npm -v

# Update node-gyp to latest
# npm install --global node-gyp@latest
# npm config set node_gyp $(npm prefix -g)/lib/node_modules/node-gyp/bin/node-gyp.js

echo "Running npm install:"; pwd
#rm -rf node_modules
#rm package-lock.json
#npm update
#npm install --legacy-peer-deps
npm install
#### BACKUP the existing FOLDER as ZIP(SITE FOLDER)

#Create build
echo "Running npm build"
npm run build

echo "STOP  PM2 SERVICE:"
{
  pm2 delete antz-web
} || {
  echo "PM2 delete catch"
}

# pm2 start npm --name "antz-web" -- start

echo "Deployed. DONE!!!"

#  DELETE ALL FOLDERS EXCEPT LAST 5 releases
ls -dt $RELEASES_DIR/*/ | tail -n +6 | xargs sudo rm -r
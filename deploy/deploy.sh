#!/bin/bash

# any future command that fails will exit the script
set -e

# Lets write the public key of our aws instance
echo 'hitting the deploy script'
eval $(ssh-agent -s)
echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add - > /dev/null

# ** Alternative approach
# echo -e "$PRIVATE_KEY" > /root/.ssh/id_rsa
# chmod 600 /root/.ssh/id_rsa
# ** End of alternative approach

# disable the host key checking.
./deploy/disableHostKeyChecking.sh

# we have already setup the DEPLOYER_SERVER in our gitlab settings which is a
# comma seperated values of ip addresses.
# release/vantara
if [ $GITHUB_REF_NAME == 'dev-release' ]
then
  DEPLOY_SERVER=$DEPLOY_SERVER_DEV
  ENV_TO_LOAD='development'
elif [ $GITHUB_REF_NAME == 'uat-release' ]
then
  DEPLOY_SERVER=$DEPLOY_SERVER_UAT
  ENV_TO_LOAD='uat'
elif [ $GITHUB_REF_NAME == 'prod-release' ]
then
  DEPLOY_SERVER=$DEPLOY_SERVER_PROD
  ENV_TO_LOAD='production'
elif [ $GITHUB_REF_NAME == 'release/farm' ]
then
  DEPLOY_SERVER=$DEPLOY_SERVER_FARM
  ENV_TO_LOAD='farm'
fi



echo $GITHUB_REF_NAME
echo "Deploying to server"
echo $DEPLOY_SERVER
echo $ENV_TO_LOAD
# lets split this string and convert this into array
# In UNIX, we can use this commond to do this
# ${string//substring/replacement}
# our substring is "," and we replace it with nothing.
ALL_SERVERS=(${DEPLOY_SERVER//,/ })
echo "ALL_SERVERS ${ALL_SERVERS}"
# Lets iterate over this array and ssh into each EC2 instance
# Once inside the server, run updateAndRestart.sh
for server in "${ALL_SERVERS[@]}"
do
  echo "deploying to ${server}"
  ssh -o UserKnownHostsFile=/github/home/.ssh/known_hosts antzsystems@${server} 'bash -s' < ./deploy/fetchRepo.sh $GITHUB_REF_NAME $ENV_TO_LOAD $GITHUB_RUN_ID $ARTIFICATE_DOWNLOAD_GITHUB_TOKEN $GITHUB_WORKFLOW $GITHUB_REPOSITORY

done

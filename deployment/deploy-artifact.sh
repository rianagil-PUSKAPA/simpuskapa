#!/bin/bash
set -e
aws s3 ls s3://simpuskapa-web-builds/webapp/ | awk '{print $4}' > versions
aws s3 cp s3://simpuskapa-web-builds/CURRENT_VERSION CURRENT_VERSION

echo "LATEST VERSION IS $(cat CURRENT_VERSION)"
echo "choose to update server"

TARGET=$(cat versions | sort --reverse | gum filter --prompt="LATEST: $(cat CURRENT_VERSION)")

SERVER=$(gum choose "development" "staging" "production")

gum confirm "Confirm to deploy (($TARGET)) to server --> $SERVER"

if [ "$SERVER" = "development" ]; then
  echo "CONNECTING TO DEV SERVER"
  ssh -i simpuskapa.pem simpuskapa@103.150.92.73 -o ServerAliveInterval=10 "cd /home/simpuskapa && rm -rf *.zip && aws s3 cp s3://simpuskapa-web-builds/webapp/$TARGET ."
  ssh -i simpuskapa.pem simpuskapa@103.150.92.73 -o ServerAliveInterval=10 "mv /home/simpuskapa/$TARGET /home/simpuskapa/simpuskapa/$TARGET"
  ssh -i simpuskapa.pem simpuskapa@103.150.92.73 -o ServerAliveInterval=10 "/home/simpuskapa/.nvm/versions/node/v18.17.0/bin/pm2 stop web && cd /home/simpuskapa/simpuskapa && rm -rf .next && unzip $TARGET && /home/simpuskapa/.nvm/versions/node/v18.17.0/bin/pm2 start web"
fi

if [ "$SERVER" = "staging" ]; then
  echo "CONNECTING TO STG SERVER"
  ssh -i simpuskapa-staging.pem ec2-user@13.214.75.123 -o ServerAliveInterval=10 "cd /home/ec2-user && rm -rf *.zip && aws s3 cp s3://simpuskapa-web-builds/webapp/$TARGET ."
  ssh -i simpuskapa-staging.pem ec2-user@13.214.75.123 -o ServerAliveInterval=10 "mv /home/ec2-user/$TARGET /home/ec2-user/simpuskapa/$TARGET"
  ssh -i simpuskapa-staging.pem ec2-user@13.214.75.123 -o ServerAliveInterval=10 "/home/ec2-user/.nvm/versions/node/v18.17.0/bin/pm2 stop web && cd /home/ec2-user/simpuskapa && rm -rf .next && unzip $TARGET && /home/ec2-user/.nvm/versions/node/v18.17.0/bin/pm2 start web"
fi

if [ "$SERVER" = "production" ]; then
  echo "CONNECTING TO STG SERVER"
  ssh -i simpuskapa-staging.pem ec2-user@18.138.190.9 -o ServerAliveInterval=10 "cd /home/ec2-user && rm -rf *.zip && aws s3 cp s3://simpuskapa-web-builds/webapp/$TARGET ."
  ssh -i simpuskapa-staging.pem ec2-user@18.138.190.9 -o ServerAliveInterval=10 "mv /home/ec2-user/$TARGET /home/ec2-user/simpuskapa/$TARGET"
  ssh -i simpuskapa-staging.pem ec2-user@18.138.190.9 -o ServerAliveInterval=10 "/home/ec2-user/.nvm/versions/node/v18.17.0/bin/pm2 stop web && cd /home/ec2-user/simpuskapa && rm -rf .next && unzip $TARGET && /home/ec2-user/.nvm/versions/node/v18.17.0/bin/pm2 start web"
fi

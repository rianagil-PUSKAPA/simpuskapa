#!/bin/bash


echo "Starting build - deploy ..."

echo "Cleaning ..."

rm -rf .next

echo "Preparing env staging ..."
cp .env.staging .env

echo "Building ..."
pnpm install
pnpm lint
pnpm build:next
zip -r fe.zip .next/*

cp .env.dev .env

echo "Uploading ..."

sftp -i simpuskapa.pem simpuskapa@103.150.92.73:/home/simpuskapa <<< $'put fe.zip'

ssh -i simpuskapa.pem simpuskapa@103.150.92.73 -o ServerAliveInterval=10 'mv /home/simpuskapa/fe.zip /home/simpuskapa/simpuskapa/fe.zip'

ssh -i simpuskapa.pem simpuskapa@103.150.92.73 -o ServerAliveInterval=10 'rm -rf /home/simpuskapa/simpuskapa/.next'

ssh -i simpuskapa.pem simpuskapa@103.150.92.73 -o ServerAliveInterval=10 'unzip -o /home/simpuskapa/simpuskapa/fe.zip -d /home/simpuskapa/simpuskapa/'

echo "Restarting Web ..."
ssh -i simpuskapa.pem simpuskapa@103.150.92.73 -o ServerAliveInterval=10 '/home/simpuskapa/.nvm/versions/node/v18.17.0/bin/pm2 restart web'

echo "Done ..."






#!/bin/bash


echo "Starting build - deploy ..."

echo "Cleaning ..."

rm -rf .next

echo "Preparing env staging ..."
cp .env.staging .env

echo "Building ..."
rm -rf fe.zip
pnpm install
pnpm prisma generate
pnpm lint
pnpm build:nest
zip -r be.zip dist-server/*

cp .env.dev .env

echo "Uploading ..."

sftp -i simpuskapa.pem simpuskapa@103.150.92.73:/home/simpuskapa <<< $'put be.zip'

ssh -i simpuskapa.pem simpuskapa@103.150.92.73 -o ServerAliveInterval=10 'mv /home/simpuskapa/be.zip /home/simpuskapa/simpuskapa/be.zip'

ssh -i simpuskapa.pem simpuskapa@103.150.92.73 -o ServerAliveInterval=10 'rm -rf /home/simpuskapa/simpuskapa/dist-server'

ssh -i simpuskapa.pem simpuskapa@103.150.92.73 -o ServerAliveInterval=10 'unzip -o /home/simpuskapa/simpuskapa/be.zip -d /home/simpuskapa/simpuskapa/'

echo "Restarting Web ..."
ssh -i simpuskapa.pem simpuskapa@103.150.92.73 -o ServerAliveInterval=10 '/home/simpuskapa/.nvm/versions/node/v18.17.0/bin/pm2 restart api'

echo "Done ..."






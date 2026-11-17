#!/bin/bash

echo "Building please wait 🚀"



pnpm lint

pnpm build:nest

echo "Packaging build 📦"

zip -r be.zip ./dist-server/*

sftp -i ./simpuskapa.pem simpuskapa@103.150.190.176:simpuskapa <<< $'put be.zip'

sftp -i ./simpuskapa.pem simpuskapa@103.150.190.176:simpuskapa <<< $'put package.json'

sftp -i ./simpuskapa.pem simpuskapa@103.150.190.176:simpuskapa <<< $'put prisma/schema.prisma'

sftp -i ./simpuskapa.pem simpuskapa@103.150.190.176:simpuskapa <<< $'put .env.prod'


ssh -i ./simpuskapa.pem simpuskapa@103.150.190.176 'rm -rf /home/simpuskapa/simpuskapa/dist-server && unzip /home/simpuskapa/simpuskapa/be.zip -d /home/simpuskapa/simpuskapa/ && mv /home/simpuskapa/simpuskapa/.env.prod /home/simpuskapa/simpuskapa/.env'

ssh -i ./simpuskapa.pem simpuskapa@103.150.190.176 -o ServerAliveInterval=10 'cd /home/simpuskapa/simpuskapa && yarn install && npx prisma generate'

ssh -i ./simpuskapa.pem simpuskapa@103.150.190.176 'sudo systemctl restart backend'


echo "Clean Up 🧹"

rm -rf ./dist-server
rm -rf be.zip

echo "Done ✅"

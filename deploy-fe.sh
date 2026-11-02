#!/bin/bash

echo "Building please wait 🚀"



pnpm lint

pnpm run build

echo "Packaging build 📦"

zip -r fe.zip ./dist-next

sftp -i ./simpuskapa.pem simpuskapa@103.150.190.176:simpuskapa <<< $'put fe.zip'
sftp -i ./simpuskapa.pem simpuskapa@103.150.190.176:simpuskapa <<< $'put .env.prod'
sftp -i ./simpuskapa.pem simpuskapa@103.150.190.176:simpuskapa <<< $'put package.json'

#sh -i ./simpuskapa.pem simpuskapa@103.150.190.176 -o ServerAliveInterval=10 'cd /home/simpuskapa/simpuskapa && yarn install'


ssh -i ./simpuskapa.pem simpuskapa@103.150.190.176 'rm -rf /home/simpuskapa/simpuskapa/dist-next && unzip /home/simpuskapa/simpuskapa/fe.zip -d /home/simpuskapa/simpuskapa/ && mv /home/simpuskapa/simpuskapa/.env.prod /home/simpuskapa/simpuskapa/.env'
ssh -i ./simpuskapa.pem simpuskapa@103.150.190.176 'rm -rf /home/simpuskapa/simpuskapa/.next && mv /home/simpuskapa/simpuskapa/dist-next /home/simpuskapa/simpuskapa/.next'


ssh -i ./simpuskapa.pem simpuskapa@103.150.190.176 'sudo systemctl restart frontend'

echo "Clean Up 🧹"

rm -rf ./dist-next
rm -rf fe.zip

echo "Done ✅"

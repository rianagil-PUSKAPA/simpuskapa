#!/bin/bash

echo "Composing containers 📦"

docker-compose down

docker-compose up -d  --wait

echo "Doing fresh migration 💽"

npx prisma generate

npx prisma migrate dev --name app

# npx prisma db seed

pnpm start:nest-dev
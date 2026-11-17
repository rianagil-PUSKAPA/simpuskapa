FROM node:18-alpine as builder

ENV PORT 8000

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app


# Installing dependencies
RUN npm install 
# Building app
RUN npx prisma generate
RUN npm run build:nest

FROM node:18-alpine as runner
WORKDIR /app

COPY --from=builder /usr/src/app/package.json.nest ./package.json
COPY --from=builder /usr/src/app/dist-server ./dist-server

RUN npm install --production


EXPOSE 8000

# Running the app
CMD ["node", "./dist-server/server/main.js"]



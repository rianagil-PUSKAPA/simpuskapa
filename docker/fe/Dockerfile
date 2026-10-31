FROM node:18-alpine as builder

ENV PORT 3000

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app

# Installing dependencies
RUN npm install

# Building app
RUN npm run build:next

FROM node:18-alpine as runner
WORKDIR /app

COPY --from=builder /usr/src/app/package.json .
COPY --from=builder /usr/src/app/next.config.js .
COPY --from=builder /usr/src/app/public ./public

COPY --from=builder /usr/src/app/.next/standalone ./
COPY --from=builder /usr/src/app/.next/static ./.next/static


EXPOSE 3000

# Running the app
CMD ["node", "server.js"]



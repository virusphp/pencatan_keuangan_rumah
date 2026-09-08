FROM node:22-alpine AS builder

WORKDIR /app

# Install openssl required by Prisma
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the SvelteKit app
RUN npm run build

# ---
FROM node:22-alpine

WORKDIR /app

# Install openssl required by Prisma in production
RUN apk add --no-cache openssl

# Copy necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "build/index.js"]

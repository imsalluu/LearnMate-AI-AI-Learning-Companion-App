# Multi-stage production Dockerfile for LearnMate AI Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

RUN npm ci

# Copy source code and build
COPY backend/tsconfig.json ./
COPY backend/src ./src

RUN npx prisma generate
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY backend/package*.json ./
COPY backend/prisma ./prisma/

RUN npm ci --only=production
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

# Create uploads directory with appropriate permissions
RUN mkdir -p /app/uploads && chown -R node:node /app

USER node

EXPOSE 5000

CMD ["node", "dist/server.js"]

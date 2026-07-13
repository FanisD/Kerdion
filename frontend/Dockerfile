# ==========================================
# Stage 1: Install Dependencies
# ==========================================
FROM node:22-slim AS deps

WORKDIR /app

# Copy dependency files first (this maximizes Docker layer caching)
COPY package.json package-lock.json ./

RUN npm ci

# ==========================================
# Stage 2: Build the Application
# ==========================================
FROM node:22-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ==========================================
# Stage 3: Final Production Runtime Image
# ==========================================
FROM node:22-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

# Copy only what's needed to run the standalone Next.js server
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose Next.js's default port
EXPOSE 3000

# Default command to run the Next.js server
CMD ["node", "server.js"]

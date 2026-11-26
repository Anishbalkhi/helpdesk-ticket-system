# ---- 1. Build the React app ----
FROM node:22-alpine AS web
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- 2. Install API production dependencies ----
FROM node:22-alpine AS api-deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev

# ---- 3. Runtime image: API + built frontend, served from one port ----
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=api-deps /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/
COPY --from=web /app/frontend/dist ./frontend/dist
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://localhost:5000/api/health || exit 1
CMD ["node", "backend/src/server.js"]

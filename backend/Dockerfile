FROM node:20-alpine AS base

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app


# =========================
# Dependencies
# =========================
FROM base AS deps

COPY package.json package-lock.json* ./

RUN npm install


# =========================
# Build
# =========================
FROM base AS build

COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN npx prisma generate

RUN npm run build


# =========================
# Production
# =========================
FROM base AS runner

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/package.json ./package.json

EXPOSE 4000

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]
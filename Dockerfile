# ---- deps: install all dependencies (needed to compile TypeScript) ----
FROM node:20-alpine AS deps
WORKDIR /app
# Copy only manifest files first so this layer stays cached until deps actually change
COPY package.json package-lock.json ./
# npm ci = clean, reproducible install from the lockfile (incl. devDependencies, needed to build)
RUN npm ci

# ---- build: compile Nest app and generate Prisma client ----
FROM node:20-alpine AS build
# openssl is required by Prisma's query engine at generate/runtime
RUN apk add --no-cache openssl
WORKDIR /app
# Reuse the deps layer instead of reinstalling everything
COPY --from=deps /app/node_modules ./node_modules
# Now bring in the actual source code
COPY . .
# Generate the Prisma client based on schema.prisma
RUN npx prisma generate
# Compile TypeScript -> dist/
RUN npm run build
# Re-install with only production deps; devDependencies are dropped so they
# don't get carried into the final image when node_modules is copied below
RUN npm ci --omit=dev

# ---- production: minimal runtime image ----
FROM node:20-alpine AS production
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
# Only copy the build artifacts and prod deps needed to run the app -
# no source TS, no devDependencies, keeping the final image small
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

# Run as a non-root user for better container security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

# On container start: apply pending Prisma migrations, then start the API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]

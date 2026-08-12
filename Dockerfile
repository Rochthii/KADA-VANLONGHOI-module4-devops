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
# Keep the generated dependency tree because the runtime command below uses
# the Prisma CLI to apply migrations before NestJS starts.

# ---- production: minimal runtime image ----
FROM node:20-alpine AS production
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
# Copy the compiled application, generated Prisma client and the Prisma CLI
# required by the startup migration command.
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

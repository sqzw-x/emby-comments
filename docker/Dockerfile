FROM node:22-alpine AS builder
WORKDIR /app
COPY . .
# Install dependencies and pnpm
RUN npm install -g pnpm
# Install dependencies and generate Prisma client
RUN pnpm install --frozen-lockfile && \
    pnpm prisma generate
# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm package


FROM oven/bun:alpine AS runner
WORKDIR /app

# Create nextjs user and setup directories
RUN bun install -g prisma

COPY --from=builder /app/build .

EXPOSE 3000

CMD ["bun","start.js"]

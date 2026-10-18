FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000 REQUIRE_EXISTING_DATABASE=true PUSH_ENABLED=false
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
# Deliberate allowlist: never copy starter accounts, local databases or secrets.
COPY *.js ./
COPY public/ ./public/
COPY docker/ ./docker/
RUN mkdir -p /app/data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node /app/docker/healthcheck.mjs
ENTRYPOINT ["sh", "/app/docker/entrypoint.sh"]
CMD ["node", "server.js"]

#!/bin/sh
set -eu
node /app/docker/check-data.mjs
exec "$@"

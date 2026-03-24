#!/bin/sh
set -e

# Prisma CLI reads from .env file directly, ignoring process.env.
# In Docker, the .env file is mounted from host (has localhost).
# We need to override DATABASE_URL in .env with the docker-compose value.
if [ -n "$DATABASE_URL" ]; then
  echo "🔧 Overriding DATABASE_URL in .env for Prisma CLI..."
  if grep -q "^DATABASE_URL=" .env 2>/dev/null; then
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL|" .env
  else
    echo "DATABASE_URL=$DATABASE_URL" >> .env
  fi
fi

echo "🔄 Waiting for database to be ready..."
echo "   Connecting to: $(echo $DATABASE_URL | sed 's|postgresql://[^@]*@||' | sed 's|/.*||')"

until npx prisma db push --skip-generate 2>/dev/null; do
  echo "⏳ Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready and schema is synced!"

echo "🔄 Generating Prisma Client..."
npx prisma generate

echo "🚀 Starting application..."
exec "$@"

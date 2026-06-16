const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

function getDatabaseUrl() {
  const configuredUrl = process.env.DATABASE_URL || 'file:./dev.db';

  if (!configuredUrl.startsWith('file:./')) {
    return configuredUrl;
  }

  return `file:${path.resolve(__dirname, '..', configuredUrl.slice('file:'.length))}`;
}

const adapter = new PrismaBetterSqlite3({
  url: getDatabaseUrl(),
});

const prisma = new PrismaClient({ adapter });

module.exports = prisma;

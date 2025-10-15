const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

prisma.$on('error', (e) => {
  console.error('Prisma error', e);
});

module.exports = prisma;
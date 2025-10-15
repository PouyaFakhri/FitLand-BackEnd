// اسکریپت ساده‌شده راه‌اندازی
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Setting up FitLand development environment...');

// ایجاد فایل env ساده‌شده
const envExample = `
# FitLand Backend Environment Variables
NODE_ENV=development
PORT=8080

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fitland?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secrets
ACCESS_SECRET=your_super_secure_access_secret_here
REFRESH_SECRET=your_super_secure_refresh_secret_here
ACCESS_EXPIRE=15m
REFRESH_EXPIRE=7d

# Security
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# Monitoring
LOG_LEVEL=info
`;

if (!fs.existsSync('.env')) {
  fs.writeFileSync('.env', envExample);
  console.log('✅ Created .env file');
}

console.log('\n🎉 Setup completed! Next steps:');
console.log('1. Run: npm install');
console.log('2. Run: docker-compose up -d');
console.log('3. Run: npx prisma db push');
console.log('4. Run: npm run seed');
console.log('5. Start developing!');
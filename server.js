require('dotenv').config();
const app = require('./src/app.js');

const PORT = process.env.PORT || 8081;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
  console.log(`🛍️  Products: http://localhost:${PORT}/api/products`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});
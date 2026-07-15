// authConfig.ts requires these at import time; set them before any test
// imports app.js so the module doesn't throw "Missing required environment
// variable".
process.env.JWT_SECRET ||= "test-jwt-secret";
process.env.JWT_REFRESH_SECRET ||= "test-jwt-refresh-secret";
process.env.NODE_ENV ||= "test";
process.env.FRONTEND_URL ||= "http://localhost:5173";
// Constructing PrismaClient reads this from env even though these tests mock
// every actual query — it just needs to be a syntactically valid URL.
process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/test_db";

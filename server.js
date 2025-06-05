const dotenv = require('dotenv');
// IMPORTANT: Load environment variables BEFORE importing app
dotenv.config({ path: './config.env' });

const app = require('./app');
const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// Replace DATABASE placeholder with actual password
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

console.log('User:', process.env.USER);
console.log('Connecting to database...');

mongoose
  .connect(DB)
  .then(() => {
    console.log('DB connection successful! 🎉');
  })
  .catch((error) => {
    console.log('DB connection error:', error.message);
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

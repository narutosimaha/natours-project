const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: './config.env' });

// To catch synchronous error that occur somewhere we do not know and so not handle for that
process.on('uncaughtException', err => {
  console.log(err.name, err.message);
  console.log('Uncaught Exception 💥. Shutting down...');
  process.exit(1);
});

const app = require('./app.js');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB connection successful'));

console.log(process.env.NODE_ENV);
const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}.....`);
});
process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('Unhandled Rejection 💥. Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});

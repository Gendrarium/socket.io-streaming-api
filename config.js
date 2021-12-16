require('dotenv').config();

const {
  PORT = 8022,
  STREAM_PORT,
  FRONTEND_URL,
  ENV,
} = process.env;

module.exports = {
  PORT,
  STREAM_PORT,
  FRONTEND_URL,
  ENV,
};

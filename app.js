const express = require('express');
const cors = require('cors');
const http = require('http');
const ss = require('socket.io-stream');
const fs = require('fs');
const path = require('path');
const ioSocket = require('socket.io');
const {
  PORT,
  STREAM_PORT,
  FRONTEND_URL,
  ENV,
} = require('./config');

const CORS_WHITELIST = [FRONTEND_URL];

const corsOption = {
  credentials: true,
  origin: function checkCorsList(origin, callback) {
    if (CORS_WHITELIST.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};
const app = express();
app.use(cors(corsOption));
const server = http.createServer(app);

let io;

if (ENV === 'dev') {
  io = ioSocket(STREAM_PORT, {
    cors: { origin: FRONTEND_URL, methods: ['GET', 'POST'] },
  });
} else {
  io = ioSocket((server, { path: '/video-socket' }));
}

io.on('connect', (client) => {
  console.log(`Client connected [id=${client.id}]`);
  client.emit('server_setup', `Server connected [id=${client.id}]`);

  ss(client).on('videoStream', (stream, data) => {
    console.log(
      `[id=${client.id}; email=${data.email}; type=video]: getting data`,
    );

    if (!fs.existsSync('streams')) {
      fs.mkdirSync('streams');
    }
    if (!fs.existsSync(path.join('streams', 'raw'))) {
      fs.mkdirSync(path.join('streams', 'raw'));
    }
    if (!fs.existsSync(path.join('streams', 'raw', data.email))) {
      fs.mkdirSync(path.join('streams', 'raw', data.email));
    }
    if (!fs.existsSync(path.join('streams', 'raw', data.email, 'video'))) {
      fs.mkdirSync(path.join('streams', 'raw', data.email, 'video'));
    }
    let filename = path.join(
      __dirname,
      'streams',
      'raw',
      data.email,
      'video',
      `${data.email}_${data.counter}`,
    );
    function handleFileExists(file) {
      if (fs.existsSync(`${file}.webm`)) {
        filename += '(1)';
        handleFileExists(filename);
      }
    }
    handleFileExists(filename);
    filename += '.webm';
    stream.pipe(fs.createWriteStream(filename));
    console.log(
      `[id=${client.id}; email=${data.email}; type=video]: saved to file`,
    );
  });
});

server.listen(PORT, () => {
  console.log(`Сервер запущен на ${PORT}`);
});

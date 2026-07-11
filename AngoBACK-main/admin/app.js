// Importações necessárias
const express = require('express');
require('dotenv').config();

const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const http = require('http');
const routes = require('./routes');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.CONEXAO,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret: process.env.KeySession,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60
  }
}));

app.use(express.static(path.join(__dirname, '../dist/Angular20/browser')));
app.use('/', routes);

app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/Angular20/browser/index.html'));
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CONEXAO,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

app.set('io', io);

module.exports = { server, io };
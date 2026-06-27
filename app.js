require('dotenv').config();
const express      = require('express');
const http         = require('http');
const { Server }   = require('socket.io');
const cors         = require('cors');

const { connectDB }      = require('./config/db');
const initSocket         = require('./sockets/socketHandler');
const globalErrorHandler = require('./middleware/errorHandler');

const authRoutes      = require('./routes/auth.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const requestRoutes   = require('./routes/materialRequest.routes');
const notifRoutes     = require('./routes/notification.routes');
const styleRoutes     = require('./routes/style.routes');
const itemsRoutes     = require('./routes/items.routes');
const scanRoutes      = require('./routes/scan.routes');

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin:      process.env.CLIENT_URL || 'http://localhost:5173',
    methods:     ['GET', 'POST'],
    credentials: true,
  },
});
app.set('io', io);
initSocket(io);

app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', function(req, res) {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth',             authRoutes);
app.use('/api/inventory',        inventoryRoutes);
app.use('/api/material-request', requestRoutes);
app.use('/api/notifications',    notifRoutes);
app.use('/api/style-details',    styleRoutes);
app.use('/api/items',            itemsRoutes);
app.use('/api/scan',             scanRoutes);

app.use(function(req, res) {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(globalErrorHandler);

var PORT = process.env.PORT || 5000;

connectDB().then(function() {
  server.listen(PORT, function() {
    console.log('SmartStore server running on port ' + PORT);
  });
});

module.exports = { app: app, server: server };

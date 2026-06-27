const jwt = require('jsonwebtoken');

const initSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token
      || socket.handshake.query && socket.handshake.query.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      var secret  = process.env.JWT_SECRET || 'smartstore_secret_key';
      var decoded = jwt.verify(token, secret);
      socket.user = decoded;
      next();
    } catch (e) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    var user = socket.user;
    console.log('Socket connected: ' + user.employee_name + ' (' + user.work_location + ') [' + socket.id + ']');

    // Store Helper joins store-room (role = 'store')
    if (user.role === 'store') {
      socket.join('store-room');
      console.log('   Joined store-room');
    }

    // Admin joins admin-room (is_admin flag)
    if (user.is_admin) {
      socket.join('admin-room');
      console.log('   Joined admin-room');
    }

    // Every user joins their own room for targeted updates
    socket.join('user-' + user.employee_id);

    socket.on('disconnect', () => {
      console.log('Socket disconnected: ' + user.employee_name + ' [' + socket.id + ']');
    });
  });
};

module.exports = initSocket;

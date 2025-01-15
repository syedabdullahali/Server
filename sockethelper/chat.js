const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Update this to restrict origins
    methods: ['GET', 'POST'],
  },
});

// Store user and admin sockets
const userSockets = new Map();
const adminSockets = new Map();

io.on('connection', (socket) => {

  // Listen for user type (admin/user) and associate with socket
  socket.on('join', ({ userId, userType }) => {
    if (userType === 'admin') {
      adminSockets.set(userId, socket.id);
      console.log(`Admin joined: ${userId}`);
    } else if (userType === 'user') {
      userSockets.set(userId, socket.id);
      console.log(`User joined: ${userId}`);
    }
  });

  // Handle messages from admin to user
  socket.on('admin-to-user', ({ toUserId, message }) => {
    const userSocketId = userSockets.get(toUserId);
    if (userSocketId) {
      io.to(userSocketId).emit('message', { from: 'admin', message });
    }
  });

  // Handle messages from user to admin
  socket.on('user-to-admin', ({ toAdminId, message }) => {
    const adminSocketId = adminSockets.get(toAdminId);
    if (adminSocketId) {
      io.to(adminSocketId).emit('message', { from: 'user', message });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const [key, value] of userSockets.entries()) {
      if (value === socket.id) userSockets.delete(key);
    }
    for (const [key, value] of adminSockets.entries()) {
      if (value === socket.id) adminSockets.delete(key);
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

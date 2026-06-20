import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected to socket.io:', socket.id);
    
    socket.on('join_room', (userId) => {
      if (userId) {
        socket.join(userId.toString());
        console.log(`User ${userId} joined their personal room`);
      }
    });
    
    socket.on('join_role_room', (role) => {
      if (role) {
        socket.join(`role_${role}`);
        console.log(`Socket ${socket.id} joined role room: role_${role}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

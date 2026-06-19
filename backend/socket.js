const { Server } = require('socket.io');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join user to their personal room for notifications
    socket.on('join-user-room', (userId) => {
      socket.join(`user-${userId}`);
    });

    // Handle real-time feed updates
    socket.on('join-feed', () => {
      socket.join('feed');
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

const emitNewPublication = (publication) => {
  if (io) {
    io.to('feed').emit('new-publication', publication);
  }
};

const emitNewLike = (publicationId, likesCount, likedBy) => {
  if (io) {
    io.to('feed').emit('publication-liked', {
      publicationId,
      likesCount,
      likedBy
    });
  }
};

const emitNewComment = (publicationId, comment) => {
  if (io) {
    io.to('feed').emit('publication-commented', {
      publicationId,
      comment
    });
  }
};

const emitNewSong = (song) => {
  if (io) {
    io.to(`user-${song.owner}`).emit('new-song', song);
  }
};

module.exports = {
  initializeSocket,
  emitNewPublication,
  emitNewLike,
  emitNewComment,
  emitNewSong
};

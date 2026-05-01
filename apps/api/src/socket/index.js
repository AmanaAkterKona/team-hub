const onlineUsers = new Map(); // workspaceId → Set of userIds

module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('join:workspace', ({ workspaceId, userId }) => {
      socket.join(workspaceId);
      if (!onlineUsers.has(workspaceId)) onlineUsers.set(workspaceId, new Set());
      onlineUsers.get(workspaceId).add(userId);
      io.to(workspaceId).emit('online:members', [...onlineUsers.get(workspaceId)]);
    });

    socket.on('disconnect', () => {
      onlineUsers.forEach((users, wsId) => {
        users.delete(socket.userId);
        io.to(wsId).emit('online:members', [...users]);
      });
    });
  });

  // Helpers exported for routes to use
  io.emitToWorkspace = (workspaceId, event, data) => {
    io.to(workspaceId).emit(event, data);
  };
};
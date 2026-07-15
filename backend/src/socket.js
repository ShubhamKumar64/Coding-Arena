const Problem = require('./models/problem');

const onlineUsers = new Map(); // userId -> { socketId, userId, firstName, status }
const activeBattles = new Map(); // battleId -> { battleId, player1: { userId, firstName, socketId }, player2: { userId, firstName, socketId }, problemId }

module.exports = function (io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Register User
    socket.on('register-user', ({ userId, firstName }) => {
      if (!userId || !firstName) return;
      
      // Clean up any stale sockets for the same user
      for (const [uid, udata] of onlineUsers.entries()) {
        if (uid === userId) {
          onlineUsers.delete(uid);
        }
      }
      
      onlineUsers.set(userId, {
        socketId: socket.id,
        userId,
        firstName,
        status: 'online'
      });
      
      console.log(`Registered online user: ${firstName} (${userId})`);
      broadcastOnlineUsers();
    });

    // Send Battle Invite
    socket.on('send-invite', ({ targetUserId }) => {
      const sender = getBySocketId(socket.id);
      const target = onlineUsers.get(targetUserId);

      if (sender && target && target.status === 'online') {
        io.to(target.socketId).emit('receive-invite', {
          senderId: sender.userId,
          senderName: sender.firstName,
          senderSocketId: socket.id
        });
      }
    });

    // Decline Invite
    socket.on('decline-invite', ({ senderSocketId }) => {
      io.to(senderSocketId).emit('invite-declined');
    });

    // Accept Invite
    socket.on('accept-invite', async ({ senderSocketId }) => {
      const sender = getBySocketId(senderSocketId);
      const receiver = getBySocketId(socket.id);

      if (sender && receiver) {
        try {
          // Check if both are still online and not in battle
          if (sender.status !== 'online' || receiver.status !== 'online') {
            socket.emit('error-msg', 'One of the players is no longer available');
            io.to(senderSocketId).emit('error-msg', 'One of the players is no longer available');
            return;
          }

          // Update status to prevent other invitations
          sender.status = 'in-battle';
          receiver.status = 'in-battle';
          broadcastOnlineUsers();

          // Select a random coding problem from MongoDB
          const count = await Problem.countDocuments();
          if (count === 0) {
            socket.emit('error-msg', 'No problems available in database');
            io.to(senderSocketId).emit('error-msg', 'No problems available in database');
            return;
          }
          const random = Math.floor(Math.random() * count);
          const randomProblem = await Problem.findOne().skip(random);

          const battleId = `battle_${Date.now()}`;
          activeBattles.set(battleId, {
            battleId,
            player1: { userId: sender.userId, firstName: sender.firstName, socketId: senderSocketId },
            player2: { userId: receiver.userId, firstName: receiver.firstName, socketId: socket.id },
            problemId: randomProblem._id
          });

          // Join sockets into the room
          socket.join(battleId);
          const senderSocket = io.sockets.sockets.get(senderSocketId);
          if (senderSocket) {
            senderSocket.join(battleId);
          }

          // Broadcast battle start event to room
          io.to(battleId).emit('battle-start', {
            battleId,
            problemId: randomProblem._id,
            players: {
              player1: { userId: sender.userId, firstName: sender.firstName },
              player2: { userId: receiver.userId, firstName: receiver.firstName }
            }
          });

          console.log(`Battle started: ${battleId} between ${sender.firstName} and ${receiver.firstName}`);
        } catch (error) {
          console.error("Error starting battle:", error);
          socket.emit('error-msg', 'Internal server error starting battle');
          io.to(senderSocketId).emit('error-msg', 'Internal server error starting battle');
        }
      }
    });

    // Join Battle Room (helps with state recovery/re-joins)
    socket.on('join-battle', ({ battleId }) => {
      socket.join(battleId);
      console.log(`User socket joined battle room ${battleId}`);
    });

    // Code editing / typing status sync
    socket.on('battle-typing', ({ battleId, isTyping }) => {
      socket.to(battleId).emit('opponent-typing', { isTyping });
    });

    // Compilation/run test results sync
    socket.on('battle-test-results', ({ battleId, passed, total }) => {
      socket.to(battleId).emit('opponent-test-results', { passed, total });
    });

    // Sending quick taunts
    socket.on('send-taunt', ({ battleId, tauntText }) => {
      socket.to(battleId).emit('receive-taunt', { tauntText });
    });

    // Code submission success (Winner declared)
    socket.on('submit-success', ({ battleId, winnerId, winnerName }) => {
      const battle = activeBattles.get(battleId);
      if (battle) {
        // Broadcast the final result to both sockets in room
        io.to(battleId).emit('battle-ended', { winnerId, winnerName });
        
        // Reset player status back to online
        const p1 = onlineUsers.get(battle.player1.userId);
        const p2 = onlineUsers.get(battle.player2.userId);
        if (p1) p1.status = 'online';
        if (p2) p2.status = 'online';
        
        activeBattles.delete(battleId);
        broadcastOnlineUsers();
        console.log(`Battle ended: ${battleId}. Winner: ${winnerName}`);
      }
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      let disconnectedUser = null;
      
      for (const [userId, user] of onlineUsers.entries()) {
        if (user.socketId === socket.id) {
          disconnectedUser = user;
          onlineUsers.delete(userId);
          break;
        }
      }

      if (disconnectedUser) {
        console.log(`Online user disconnected: ${disconnectedUser.firstName}`);
        
        // Check if disconnected user was in a battle
        for (const [battleId, battle] of activeBattles.entries()) {
          if (battle.player1.userId === disconnectedUser.userId || battle.player2.userId === disconnectedUser.userId) {
            const opponent = battle.player1.userId === disconnectedUser.userId ? battle.player2 : battle.player1;
            
            // Notify remaining player of forfeit win
            io.to(battleId).emit('battle-ended', { 
              winnerId: opponent.userId, 
              winnerName: opponent.firstName,
              isForfeit: true 
            });

            // Set opponent back to online status
            const oppUser = onlineUsers.get(opponent.userId);
            if (oppUser) oppUser.status = 'online';

            activeBattles.delete(battleId);
            console.log(`Battle ${battleId} ended by forfeit because ${disconnectedUser.firstName} disconnected`);
          }
        }
        
        broadcastOnlineUsers();
      }
    });
  });

  function getBySocketId(socketId) {
    for (const user of onlineUsers.values()) {
      if (user.socketId === socketId) return user;
    }
    return null;
  }

  function broadcastOnlineUsers() {
    const list = Array.from(onlineUsers.values()).map(u => ({
      userId: u.userId,
      firstName: u.firstName,
      status: u.status
    }));
    io.emit('update-online-users', list);
  }
};

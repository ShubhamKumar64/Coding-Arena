import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [incomingInvite, setIncomingInvite] = useState(null);
  const [inviteStatus, setInviteStatus] = useState(null); // 'waiting', 'declined', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      console.log('Connecting to socket at:', socketUrl);
      
      const newSocket = io(socketUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Socket connected successfully:', newSocket.id);
        newSocket.emit('register-user', {
          userId: user._id,
          firstName: user.firstName,
        });
      });

      newSocket.on('update-online-users', (users) => {
        setOnlineUsers(users);
      });

      newSocket.on('receive-invite', (invite) => {
        setIncomingInvite(invite);
      });

      newSocket.on('invite-declined', () => {
        setInviteStatus('declined');
        setTimeout(() => setInviteStatus(null), 3000);
      });

      newSocket.on('error-msg', (msg) => {
        setErrorMessage(msg);
        setInviteStatus('error');
        setTimeout(() => {
          setInviteStatus(null);
          setErrorMessage('');
        }, 3000);
      });

      newSocket.on('battle-start', ({ battleId, problemId, players }) => {
        setIncomingInvite(null);
        setInviteStatus(null);
        
        // Find opponent's name
        const opponent = players.player1.userId === user._id ? players.player2 : players.player1;
        
        console.log('Battle starting! Navigating to battle page...');
        navigate(`/battle/${battleId}`, { 
          state: { 
            problemId, 
            opponentName: opponent.firstName,
            opponentId: opponent.userId
          } 
        });
      });

      setSocket(newSocket);

      return () => {
        console.log('Disconnecting socket...');
        newSocket.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [isAuthenticated, user]);

  const sendInvite = (targetUserId) => {
    if (socket) {
      setInviteStatus('waiting');
      socket.emit('send-invite', { targetUserId });
    }
  };

  const acceptInvite = (senderSocketId) => {
    if (socket && incomingInvite) {
      socket.emit('accept-invite', { senderSocketId });
      setIncomingInvite(null);
    }
  };

  const declineInvite = (senderSocketId) => {
    if (socket && incomingInvite) {
      socket.emit('decline-invite', { senderSocketId });
      setIncomingInvite(null);
    }
  };

  return (
    <SocketContext.Provider value={{
      socket,
      onlineUsers,
      incomingInvite,
      setIncomingInvite,
      inviteStatus,
      setInviteStatus,
      errorMessage,
      sendInvite,
      acceptInvite,
      declineInvite
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

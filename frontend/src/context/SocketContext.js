import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { BASE_URL } from '../config/api';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io(BASE_URL, {
        transports: ['websocket'],
        upgrade: false,
      });

      // Join user room and feed
      newSocket.emit('join-user-room', user.id);
      newSocket.emit('join-feed');

      setSocket(newSocket);

      return () => newSocket.close();
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const socket = useContext(SocketContext);
  if (!socket) {
    console.warn('Socket not initialized. Make sure you are logged in.');
  }
  return socket;
};

import { io } from 'socket.io-client';

// Set REACT_APP_SOCKET_URL in your .env file to override this in production or custom setups.
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket'],
    });
  }
  return socket;
};

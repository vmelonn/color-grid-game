import { io, Socket } from 'socket.io-client';

const SOCKET_URL = '/';

let socket: Socket | null = null;
let isConnecting = false;
let connectionPromise: Promise<Socket | null> | null = null;

interface User {
  _id: string; 
  username: string;
  profile_picture_url?: string; 
  coins?: number;
}

export const connectSocket = (token: string): Promise<Socket | null> => {
  if (socket?.connected) {
    return Promise.resolve(socket);
  }

  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  isConnecting = true;

    connectionPromise = new Promise((resolve, reject) => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    if (!user) {
      isConnecting = false;
      reject(new Error('No user data found for socket connection'));
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: {
        token,
        user: {
          id: user.id,
          username: user.username,
          profilePictureUrl: user.profilePictureUrl
        }
      },
      reconnection: true,
      reconnectionAttempts: 5,  
      reconnectionDelay: 1000,
      timeout: 20000,
      transports: ['websocket', 'polling'], 
      path: '/socket.io/',
    });

    newSocket.on('connect', () => {
      socket = newSocket;       
      isConnecting = false;
      resolve(socket);
    });

    newSocket.on('connect_error', (error) => {
      newSocket.disconnect();
      isConnecting = false;
      connectionPromise = null; 
      reject(error); 
    });

    newSocket.on('disconnect', (reason) => {
      if (socket === newSocket) {
          socket = null;
          connectionPromise = null; 
      }
      isConnecting = false; 
    });

  });

  return connectionPromise;
};

export const findMatch = (user: User) => {
  if (!socket?.connected) {
    throw new Error('Socket not connected');
  }
  
  const currentSocket = socket; 

  return new Promise<void>((resolve, reject) => {
    try {
      const timeoutId = setTimeout(() => {
         
         if (currentSocket) {
             currentSocket.off('error', errorHandler);
             currentSocket.off('waiting_for_players', successHandler);
         }
         reject(new Error('Matchmaking request timed out.'));
      }, 10000);

      const errorHandler = (error: { message: string }) => {
        clearTimeout(timeoutId);
        if (currentSocket) {
             currentSocket.off('waiting_for_players', successHandler);
        }
        reject(new Error(error.message || 'Failed to find match'));
      };

      const successHandler = () => {
           clearTimeout(timeoutId);
            if (currentSocket) {
                 currentSocket.off('error', errorHandler);
            }
           resolve();
      };

      
      currentSocket.once('error', errorHandler);
      currentSocket.once('waiting_for_players', successHandler);
      
      currentSocket.emit('find_match', {
        _id: user._id,
        id: user._id, 
        username: user.username,
        profilePicture: user.profile_picture_url,
        coins: user.coins
      });

    } catch (error) {
      reject(error);
    }
  });
};

export const makeMove = (gameId: string, row: number, col: number) => {
  if (!socket?.connected) {
    throw new Error('Socket not connected');
  }
  socket.emit('make_move', { gameId, row, col });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnecting = false;
    connectionPromise = null;
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const isSocketConnected = (): boolean => {
    return socket?.connected || false;
}; 
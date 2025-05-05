import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSocket, findMatch, connectSocket, isSocketConnected } from '../utils/socket';
import { User as GameUser } from '../types';
import './WaitingRoom.css';

type CurrentUserType = ReturnType<typeof useAuth>['user'];

interface GameStartData {
  gameId: string;
  player1: {
    id: string;
    username: string;
    color: string;
  };
  player2: {
    id: string;
    username: string;
    color: string;
  };
  currentTurn: 'player1' | 'player2';
  grid: (string | null)[][];
}

interface WaitingData {
  count: number;
}

interface ErrorData {
  message: string;
}

const WaitingRoom: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState('Checking connection...');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const matchmakingRef = useRef(false);
  const listenersAttached = useRef(false);
  const isMounted = useRef(true);


  const startMatchmaking = useCallback(async (currentUser: CurrentUserType) => {
      if (!currentUser) {
          setError('User authentication error.');
          return;
      }
      const currentSocket = getSocket();
      if (!isMounted.current || matchmakingRef.current || !currentSocket || !isSocketConnected()) {
          return;
      }
      setError(null);
      matchmakingRef.current = true;
      setIsSearching(true);
      setStatus('Finding opponent...');
      
      try {
        const gameUser: GameUser = {
          _id: currentUser.id,
          username: currentUser.username,
          profile_picture_url: currentUser.profilePictureUrl,
          coins: currentUser.coins ?? 0
        };
        await findMatch(gameUser);
      } catch (error: any) {
         if (isMounted.current) {
            setError(error.message || 'Failed to start searching for match.');
            setStatus('Error');
            setIsSearching(false);
            matchmakingRef.current = false;
         }
      }
  }, []);
  
  const setupMatchmaking = useCallback((currentUser: CurrentUserType) => {
      if (!isSearching && !matchmakingRef.current && isSocketConnected()) {
          startMatchmaking(currentUser);
      }
  }, [isSearching, startMatchmaking]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
        isMounted.current = false;
        listenersAttached.current = false;
        if (matchmakingRef.current) {
            const socket = getSocket();
            if (socket) {
                socket.emit('cancel_match');
            }
            matchmakingRef.current = false;
        }
    };
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (listenersAttached.current) {
        return;
    }

    const socket = getSocket();

    const gameStartedHandler = (data: GameStartData) => {
       if (!isMounted.current) return;
        
        if (!user) return;

        const isPlayer1 = data.player1.id === user.id;
        const isPlayer2 = data.player2.id === user.id;
        
        if (!isPlayer1 && !isPlayer2) {
          return;
        }

        matchmakingRef.current = false;
        setIsSearching(false);
        setError(null);
        setStatus('Match found! Starting game...');
        
        try {
            const currentGameState = {
                ...data,
                isPlayer1,
                myColor: isPlayer1 ? data.player1.color : data.player2.color,
                isMyTurn: (isPlayer1 && data.currentTurn === 'player1') || (!isPlayer1 && data.currentTurn === 'player2'),
                myId: user.id
            };
            sessionStorage.setItem('currentGame', JSON.stringify(currentGameState));

            if (isMounted.current) {
                 navigate(`/game/${data.gameId}`);
            }
           
        } catch(e) {
             if (isMounted.current) {
                 setError('Error starting game.');
                 setStatus('Error');
                 matchmakingRef.current = false;
                 setIsSearching(false);
              }
        }
    };

    const errorHandler = (errorData: ErrorData) => {
        if (!isMounted.current) return;
        setError(errorData.message || 'An error occurred during matchmaking.');
        setStatus('Error');
        setIsSearching(false);
        matchmakingRef.current = false;
    };

    const waitingHandler = (data: WaitingData) => {
        if (!isMounted.current) return;
        if (isSearching) {
            setStatus(`Waiting for opponent... (${data.count} in queue)`);
        }
    };
    
    const connectHandler = () => {
        if (!isMounted.current) return;
        setStatus('Connected. Preparing matchmaking...');
        setupMatchmaking(user); 
    };
    
    const disconnectHandler = (reason: string) => {
         if (!isMounted.current) return;
         setError('Lost connection to the server.');
         setStatus('Disconnected');
         setIsSearching(false);
         matchmakingRef.current = false;
    };

    let listenersWereAttached = false;

    if (socket && isSocketConnected() && !listenersAttached.current) {
        setStatus('Connected. Preparing matchmaking...');
        
        socket.on('start_game', gameStartedHandler);
        socket.on('error', errorHandler);
        socket.on('waiting_for_players', waitingHandler);
        socket.on('connect', connectHandler); 
        socket.on('disconnect', disconnectHandler);
        listenersAttached.current = true;
        listenersWereAttached = true;
        
        setupMatchmaking(user);

    } else if (!socket || !isSocketConnected()) {
        setStatus('Connecting to server...');
        const tempSocket = getSocket();
        if (tempSocket && !listenersAttached.current) {
            tempSocket.once('connect', connectHandler);
             tempSocket.on('start_game', gameStartedHandler);
             tempSocket.on('error', errorHandler);
             tempSocket.on('waiting_for_players', waitingHandler);
             tempSocket.on('disconnect', disconnectHandler);
             listenersAttached.current = true;
             listenersWereAttached = true;
        } else if (!tempSocket) {
             
        }

    } else if (listenersAttached.current) {
        
    }

    return () => {
        if (listenersWereAttached) { 
            const cleanupSocket = getSocket();
            if (cleanupSocket) {
                cleanupSocket.off('start_game', gameStartedHandler);
                cleanupSocket.off('error', errorHandler);
                cleanupSocket.off('waiting_for_players', waitingHandler);
                cleanupSocket.off('connect', connectHandler); 
                cleanupSocket.off('disconnect', disconnectHandler);
            }
            listenersAttached.current = false;
        } else {
            
        }
    };

  }, [user, navigate, setupMatchmaking]);

  // --- Button Handlers --- 

  const handleCancel = () => {
    const socket = getSocket();
    if (socket && (isSearching || matchmakingRef.current)) {
      socket.emit('cancel_match');
      matchmakingRef.current = false;
      setIsSearching(false);
      setStatus('Search cancelled.');
    } else {
      
    }
    navigate('/home');
  };

  const handleRetry = () => {
     if (!user || isSearching || matchmakingRef.current) {
         return;
     }
     setError(null);
     setStatus('Retrying connection...');
     
     const token = localStorage.getItem('token');
     if (token) {
         connectSocket(token)
            .then(socket => {
                if (socket && isMounted.current) {
                     startMatchmaking(user);
                } else if (isMounted.current) {
                     setError('Failed to reconnect. Please try again later.');
                     setStatus('Connection Failed');
                }
            })
            .catch(err => {
                 if (isMounted.current) {
                     setError('Failed to reconnect. Please try again later.');
                     setStatus('Connection Failed');
                 }
            });
     } else {
         setError('Authentication error. Please log in again.');
         navigate('/login');
     }
  };

  // --- Render Logic --- 
  return (
    <div className="waiting-room">
      <div className="waiting-content">
        <h1>Finding Match</h1>
        <div className="status-container">
          <p className="status-text">{status}</p>
          {isSearching && !error && (
            <div className="loading-spinner"></div>
          )}
          {error && (
            <p className="error-text">{error}</p>
          )}
        </div>
        <div className="button-container">
          <button 
            onClick={handleCancel} 
            className="cancel-button"
            disabled={!isSearching && !matchmakingRef.current}
          >
            Cancel Search
          </button>
          {error && (
            <button 
              onClick={handleRetry} 
              className="retry-button"
              disabled={isSearching || matchmakingRef.current}
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaitingRoom; 
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSocket, makeMove, isSocketConnected } from '../utils/socket';
import './Game.css';

interface User {
  id: string;
  username: string;
  profilePictureUrl?: string;
}

interface PlayerData {
  id: string;
  username: string;
  color: string;
  profilePictureUrl?: string; 
}

interface GameStartData {
  gameId: string;
  player1: PlayerData;
  player2: PlayerData;
  currentTurn: 'player1' | 'player2';
  grid: (string | null)[][];
}

interface MoveMadeData {
  gameId: string;
  row: number;
  col: number;
  color: string;
  currentTurn: 'player1' | 'player2';
  grid: (string | null)[][];
}

interface GameEndData {
  winner?: string | 'draw'; 
  error?: string;
  grid?: (string | null)[][]; 
  reason?: string; 
}

interface CurrentGameState {
  gameId: string;
  player1: PlayerData;
  player2: PlayerData;
  currentTurn: 'player1' | 'player2';
  grid: (string | null)[][];
  isPlayer1: boolean;
  myColor: string;
  isMyTurn: boolean;
  myId: string;
}

const Game: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [grid, setGrid] = useState<(string | null)[][]>(Array(5).fill(null).map(() => Array(5).fill(null)));
  const [opponent, setOpponent] = useState<PlayerData | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [gameStatus, setGameStatus] = useState('Connecting...');
  const [gameEnded, setGameEnded] = useState(false);
  const [playerColor, setPlayerColor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const isMounted = useRef(true);
  const listenersAttached = useRef(false);
  const gameInitialized = useRef(false); 

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      listenersAttached.current = false;
    };
  }, []);

  useEffect(() => {
    if (!user || !gameId) {
      navigate('/login');
      return;
    }

    if (listenersAttached.current) {
      return;
    }
    
    const socket = getSocket(); 

    if (!socket || !isSocketConnected()) {
        setGameStatus('Connecting...');
        return;
    }

    listenersAttached.current = true;
    setGameStatus('Checking for existing game data...');
    
    const initializeOrUpdateGameState = (data: GameStartData | CurrentGameState, source: 'session' | 'event') => {
        if (!isMounted.current) {
            return;
        }
        
        if (!data || data.gameId !== gameId) {
            if (source === 'session') {
                 const existingStateStr = sessionStorage.getItem('currentGame');
                 if (existingStateStr) {
                     try {
                         const existingState = JSON.parse(existingStateStr);
                         if (existingState.gameId !== gameId) {
                             sessionStorage.removeItem('currentGame');
                         }
                     } catch (e) { sessionStorage.removeItem('currentGame'); }
                 }
            }
            return;
        }
        
        if (gameInitialized.current) { 
             return;
        }

        try {
            if (!data.player1 || !data.player2 || !data.currentTurn || !data.grid) {
                 setError('Received incomplete game data.');
                 return;
            }

            const storedUserStr = localStorage.getItem('user');
            if (!storedUserStr) {
              setError('Critical error: Missing user data.');
              return;
            }
             const storedUser = JSON.parse(storedUserStr) as User;

            let p1Id = data.player1.id;
            if (typeof p1Id === 'object' && p1Id !== null && '_id' in p1Id) {
                 p1Id = (p1Id as any)._id;
            }
            let p2Id = data.player2.id;
             if (typeof p2Id === 'object' && p2Id !== null && '_id' in p2Id) {
                 p2Id = (p2Id as any)._id;
            }
             p1Id = String(p1Id);
             p2Id = String(p2Id);

            const isPlayer1 = p1Id === storedUser.id;
            const myTurn = (isPlayer1 && data.currentTurn === 'player1') || 
                           (!isPlayer1 && data.currentTurn === 'player2');
            const myColor = isPlayer1 ? data.player1.color : data.player2.color;

            setGrid(data.grid);
            setIsMyTurn(myTurn);
            setPlayerColor(myColor);
            setOpponent(isPlayer1 ? data.player2 : data.player1);
            setGameStatus(myTurn ? 'Your Turn' : 'Opponent Turn');
            setGameEnded(false); 
            setError(null); 
            gameInitialized.current = true; 
            
            const currentGameState: CurrentGameState = {
               gameId: data.gameId,
               player1: { ...data.player1, id: p1Id }, 
               player2: { ...data.player2, id: p2Id }, 
               currentTurn: data.currentTurn,
               grid: data.grid,
               isPlayer1,
               myColor,
               isMyTurn: myTurn,
               myId: storedUser.id
            };
            sessionStorage.setItem('currentGame', JSON.stringify(currentGameState));

        } catch (e) {
            setError('Failed to process game state. Error logged.');
            gameInitialized.current = false; 
         }
    };

    const existingStateStr = sessionStorage.getItem('currentGame');
    if (existingStateStr && !gameInitialized.current) { 
      try {
          const existingState = JSON.parse(existingStateStr) as CurrentGameState;
          initializeOrUpdateGameState(existingState, 'session'); 
      } catch (e) {
          sessionStorage.removeItem('currentGame');
      }
    } 
 
    const handleStartGame = (data: GameStartData) => {
        initializeOrUpdateGameState(data, 'event'); 
    };
    
    const handleMoveMade = (data: MoveMadeData) => {
        if (!isMounted.current) return;
        
         try {
           if (!data || data.grid === undefined || data.currentTurn === undefined) {
               setError('Received incomplete move data.');
               return;
           }

           setGrid(data.grid);

           const gameStateStr = sessionStorage.getItem('currentGame');
           if (!gameStateStr) {
             setError('Critical error: Missing game state.');
             return;
           }
           const currentGame = JSON.parse(gameStateStr) as CurrentGameState;
           
           const isMyTurnNow = (currentGame.isPlayer1 && data.currentTurn === 'player1') || 
                             (!currentGame.isPlayer1 && data.currentTurn === 'player2');

           setIsMyTurn(isMyTurnNow);
           setGameStatus(isMyTurnNow ? 'Your Turn' : 'Opponent Turn');
           
           const updatedGameState = { ...currentGame, grid: data.grid, currentTurn: data.currentTurn, isMyTurn: isMyTurnNow };
           sessionStorage.setItem('currentGame', JSON.stringify(updatedGameState));

         } catch(e) {
             setError('Failed to process opponent move.');
         }
    };

    const handleGameEnd = (data: GameEndData) => {
        if (!isMounted.current) return;

        try {
            if (data.grid) {
                 setGrid(data.grid);
            } else {
                 setError('No final grid data received.');
            }
            
            setGameEnded(true);
            setIsMyTurn(false);

            if (data.error) {
                setGameStatus(`Game Over: ${data.error}`);
            } else if (data.reason) { 
                setGameStatus(`Game Over: ${data.reason}`);
            } else if (data.winner === 'draw') { 
                setGameStatus('Game Over: Draw');
            } else if (user && data.winner === user.id) { 
                setGameStatus('Game Over: You Won! (+200 coins)'); 
            } else { 
                 if (user && typeof user.coins === 'number' && user.coins > 0) {
                     setGameStatus('Game Over: You Lost. (-200 coins)'); 
                 } else {
                     setGameStatus('Game Over: You Lost.'); 
                 }
            }
            sessionStorage.removeItem('currentGame');
        } catch(e) {
            setError('Failed to process game end.');
        }
    };

    const handleError = (errorData: { message: string }) => {
        if (!isMounted.current) return;
        setError(errorData.message || 'An unknown error occurred.');
        setGameStatus('Error');
        gameInitialized.current = false; 
    };

    socket.on('start_game', handleStartGame);
    socket.on('move_made', handleMoveMade);
    socket.on('game_end', handleGameEnd);
    socket.on('error', handleError);

    return () => {
      socket?.off('start_game', handleStartGame);
      socket?.off('move_made', handleMoveMade);
      socket?.off('game_end', handleGameEnd);
      socket?.off('error', handleError);
      listenersAttached.current = false; 
    };

  }, [user, gameId, navigate]); 

  const handleCellClick = (row: number, col: number) => {
    const gameStateStr = sessionStorage.getItem('currentGame');
    const currentGameState = gameStateStr ? JSON.parse(gameStateStr) as CurrentGameState : null;

    if (!isMyTurn || !currentGameState || !currentGameState.isMyTurn || gameEnded || currentGameState.grid[row]?.[col] !== null) {
         return;
    }

    try {
        makeMove(gameId!, row, col);
        
        setGrid(prevGrid => {
            const newGrid = prevGrid.map(r => [...r]); 
            newGrid[row][col] = playerColor;
            return newGrid;
        });
        setIsMyTurn(false);
        setGameStatus('Opponent Turn');

        const updatedSessionState = { 
            ...currentGameState, 
            grid: currentGameState.grid.map((r, rIdx) => rIdx === row ? r.map((c, cIdx) => cIdx === col ? playerColor : c) : [...r]),
            currentTurn: currentGameState.isPlayer1 ? 'player2' : 'player1', 
            isMyTurn: false 
        };
        sessionStorage.setItem('currentGame', JSON.stringify(updatedSessionState));

    } catch (error) {
        setError('Failed to send move.');
    }
  };

  const handleForfeit = () => {
    if (gameEnded) return; 
    const socket = getSocket();
    if (socket && gameId) {
        socket.emit('forfeit_game', { gameId });
        setGameStatus('You forfeited.'); 
        setGameEnded(true);
        setIsMyTurn(false);
        sessionStorage.removeItem('currentGame'); 
    } else {
        setError('Failed to send forfeit request.');
    }
  };
  
  const handlePlayAgain = () => {
    navigate('/newgame/waiting'); 
  };
 
  if (error) {
    return <div className="error-container">Error: {error}</div>;
  }
  
  if (!gameInitialized.current) {
      return <div className="loading-container">{opponent ? 'Loading Game...' : 'Connecting...'}</div>;
  }

  return (
    <div className="game-container">
      {/* Header */} 
      <div className="game-header">
        <div className={`player-info ${isMyTurn && !gameEnded ? 'current-turn' : ''}`}>
          <img src={user?.profilePictureUrl || './default-avatar.png'} alt={user?.username} className="profile-pic" />
          <span>{user?.username} (You)</span>
          <span className="player-color">{playerColor}</span>
        </div>
        <div className="vs">VS</div>
        <div className={`player-info ${!isMyTurn && !gameEnded ? 'current-turn' : ''}`}>
          <img src={opponent?.profilePictureUrl || './default-avatar.png'} alt={opponent?.username} className="profile-pic" />
          <span>{opponent?.username}</span>
          <span className="player-color">{playerColor === 'red' ? 'blue' : 'red'}</span>
        </div>
      </div>
      
      {/* Status */} 
      <p className={`game-status ${gameEnded ? 'game-ended' : (isMyTurn ? 'my-turn' : 'opponent-turn')}`}>
        {gameStatus} 
      </p>
      
      {/* Grid */} 
      <div className="game-grid">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="grid-row">
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`grid-cell 
                    ${cell || 'empty'} 
                    ${!cell && isMyTurn && !gameEnded ? 'playable' : ''} 
                    ${cell ? 'occupied' : ''} 
                    ${!isMyTurn && !gameEnded ? 'not-my-turn' : ''}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                title={!cell && isMyTurn && !gameEnded ? 'Click to place your color' : (cell ? 'Cell occupied' : 'Opponent\'s turn')}
              >
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Game Action Buttons */} 
      <div className="game-actions">
          {!gameEnded && (
              <button onClick={handleForfeit} className="action-button forfeit-button">
                  Forfeit
              </button>
          )}
          {gameEnded && (
              <button onClick={handlePlayAgain} className="action-button play-again-button">
                  Play Again
              </button>
          )}
      </div>
      
    </div>
  );
};

export default Game;
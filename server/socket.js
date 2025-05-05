const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const Game = require('./models/Game');
const { finalizeGame } = require('./controllers/gameController');

let waitingPlayers = [];
const activeGames = new Map();

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {

    if (socket.handshake?.auth?.user) {
      socket.data.user = socket.handshake.auth.user;
    } else {
      
    }

    socket.on('find_match', async (playerData) => {

      if (!playerData?._id && !playerData?.id) {
        socket.emit('error', { message: 'Invalid player data provided.' });
        return;
      }
      
      const playerId = playerData._id || playerData.id;
      const playerUsername = playerData.username || 'unknown';

      try {
        let isInActiveGame = false;
        for (const [gameId, game] of activeGames.entries()) {
             if (game.status === 'active' && (game.player1.id.toString() === playerId || game.player2.id.toString() === playerId)) {
                 isInActiveGame = true;
                 socket.emit('error', { message: 'You are already in an active game.' });
                 break;
             }
        }
        if (isInActiveGame) {
            return; 
        }

        const isAlreadyWaiting = waitingPlayers.some(player => player.id === playerId);
        if (isAlreadyWaiting) {
            waitingPlayers = waitingPlayers.filter(player => player.id !== playerId);
        } else {
            
        }

        waitingPlayers.push({
          socketId: socket.id,
          id: playerId, 
          username: playerUsername
        });

        if (waitingPlayers.length >= 2) {
          const player1 = waitingPlayers.shift();
          const player2 = waitingPlayers.shift();

          const colors = ['red', 'blue'];
          const randomIndex = Math.floor(Math.random() * 2);
          const player1Color = colors[randomIndex];
          const player2Color = colors[1 - randomIndex];
          
          const game = new Game({
              player1: {
                  id: player1.id,
                  socketId: player1.socketId, 
                  username: player1.username,
                  color: player1Color
              },
              player2: {
                  id: player2.id,
                  socketId: player2.socketId,
                  username: player2.username,
                  color: player2Color
              },
              status: 'active', 
              currentTurn: 'player1', 
              grid: Array(5).fill(null).map(() => Array(5).fill(null)) 
          });
          await game.save();
          const gameId = game._id.toString();
          
          const activeGameData = game.toObject(); 
          activeGames.set(gameId, activeGameData);
          
          const gameRoom = `game_${gameId}`;
          const player1Socket = io.sockets.sockets.get(player1.socketId);
          const player2Socket = io.sockets.sockets.get(player2.socketId);
          
          if (player1Socket) {
             player1Socket.join(gameRoom);
          } else {
              
          }
           if (player2Socket) {
             player2Socket.join(gameRoom);
           } else {
               
           }

          const gameStartData = {
              gameId: gameId,
              player1: activeGameData.player1, 
              player2: activeGameData.player2,
              currentTurn: activeGameData.currentTurn,
              grid: activeGameData.grid,
              status: activeGameData.status
          };

          io.to(gameRoom).emit('start_game', gameStartData);
        } else {
          socket.emit('waiting_for_players', { count: waitingPlayers.length });
        }
      } catch (error) {
        console.error('[Find Match] Error during matchmaking:', error); 
        socket.emit('error', { message: 'Failed to start game due to server error.' });
      }
    });

    socket.on('make_move', async ({ gameId, row, col }) => {

      try {
        let game = activeGames.get(gameId);
        
        if (game && game.status === 'finished') {
            socket.emit('error', { message: 'Game already finished' });
            return;
        }

        if (!game || game.status !== 'active') { 
            const gameFromDb = await Game.findById(gameId).lean(); 
             if (!gameFromDb || gameFromDb.status !== 'active') {
                socket.emit('error', { message: 'Invalid or finished game' });
                return;
            }
            game = gameFromDb; 
            activeGames.set(gameId, game); 
        }

        const userId = socket.data?.user?.id;
        if (!userId) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }
                
        let playerRole = null;
        let playerColor = null;
        
        if (userId === game.player1.id.toString()) { 
            playerRole = 'player1';
            playerColor = game.player1.color;
        } else if (userId === game.player2.id.toString()) { 
            playerRole = 'player2';
            playerColor = game.player2.color;
        }

        if (!playerRole) {
             console.error(`[Make Move] Could not determine player role for user ${userId} in game ${gameId}.`); 
             console.error(`[Make Move] Game Data - P1: ${game.player1.id}, P2: ${game.player2.id}`); 
             socket.emit('error', { message: 'Internal server error: Could not verify player.' });
             return;
        }

        if (playerRole !== game.currentTurn) {
          socket.emit('error', { message: 'Not your turn' });
          return;
        }

        if (game.grid[row]?.[col] !== null) {
            socket.emit('error', { message: 'Cell already occupied' });
            return;
        }

        game.grid[row][col] = playerColor;

        const isGridFull = game.grid.flat().every(cell => cell !== null);
        
        if (!isGridFull) {
            const nextTurn = game.currentTurn === 'player1' ? 'player2' : 'player1';
            game.currentTurn = nextTurn; 
            
            activeGames.set(gameId, game); 

            Game.findByIdAndUpdate(gameId, { grid: game.grid, currentTurn: nextTurn })
                .then(() => {})
                .catch(err => console.error(`[Make Move] Error updating ongoing game ${gameId} in DB:`, err)); 

            const moveData = {
                gameId,
                row,
                col,
                color: playerColor,
                currentTurn: nextTurn,
                grid: game.grid
            };
            io.to(`game_${gameId}`).emit('move_made', moveData);

        } else { 
            try {
                const finalizedGame = await finalizeGame(gameId, 'win_by_area', { finalGrid: game.grid }); 
                
                if (finalizedGame) {
                     activeGames.set(gameId, finalizedGame);
                    
                    const gameEndData = {
                        gameId: gameId,
                        status: finalizedGame.status,
                        winner: finalizedGame.winner, 
                        grid: finalizedGame.grid 
                    };
                    io.to(`game_${gameId}`).emit('game_end', gameEndData);
                    
                     setTimeout(() => { 
                         if (activeGames.has(gameId)) {
                            activeGames.delete(gameId);
                         }
                     }, 60000); 
                } else {
                     console.error(`[Game End] finalizeGame returned null for game ${gameId} after grid full.`); 
                     io.to(`game_${gameId}`).emit('error', { message: 'Error finalizing game state.'});
                }
            } catch(finalizeError) {
                 console.error(`[Game End] Error calling finalizeGame for ${gameId} after grid full:`, finalizeError); 
                 io.to(`game_${gameId}`).emit('error', { message: 'Server error ending game.'});
            }
        }

      } catch (error) {
        console.error('[Make Move] Error processing move:', error); 
        socket.emit('error', { message: 'Failed to process move due to server error.' });
      }
    });

    socket.on('disconnect', async (reason) => { 
        const userId = socket.data?.user?.id;
        const username = socket.data?.user?.username;
        
        const wasWaiting = waitingPlayers.some(player => player.socketId === socket.id);
        if (wasWaiting) {
          waitingPlayers = waitingPlayers.filter(player => player.socketId !== socket.id);
        }

        const gamesToCheck = Array.from(activeGames.entries()); 
        
        for (const [gameId, game] of gamesToCheck) {
            if (game.status === 'finished') continue; 

            let disconnectedPlayerRole = null;
            let winnerId = null; 
            
            if (game.player1.socketId === socket.id) {
                disconnectedPlayerRole = 'player1';
                winnerId = game.player2.id; 
            } else if (game.player2.socketId === socket.id) {
                disconnectedPlayerRole = 'player2';
                winnerId = game.player1.id; 
            }

            if (disconnectedPlayerRole) {
                try {
                    const finalizedGame = await finalizeGame(gameId, 'disconnect', { winnerId: winnerId }); 
                    
                    if (finalizedGame) {
                        activeGames.set(gameId, finalizedGame);

                        const gameEndData = {
                            gameId: gameId,
                            status: finalizedGame.status,
                            winner: finalizedGame.winner,
                            reason: 'Opponent disconnected'
                        };
                        io.to(`game_${gameId}`).emit('game_end', gameEndData);

                        activeGames.delete(gameId);
                    } else {
                         console.error(`[Disconnect] finalizeGame returned null for game ${gameId} on disconnect.`); 
                          io.to(`game_${gameId}`).emit('error', { message: 'Error finalizing game state after disconnect.'});
                    }
                } catch(finalizeError) {
                     console.error(`[Disconnect] Error calling finalizeGame for ${gameId} on disconnect:`, finalizeError); 
                     io.to(`game_${gameId}`).emit('error', { message: 'Server error ending game after disconnect.'});
                }
            }
        }
    });

    socket.on('forfeit_game', async ({ gameId }) => {
        const userId = socket.data?.user?.id;
        const username = socket.data?.user?.username;
        
        if (!userId || !gameId) {
            socket.emit('error', { message: 'Invalid forfeit request.' });
            return;
        }

        const game = activeGames.get(gameId);
        if (!game || game.status === 'finished') {
            return;
        }

        let winnerId = null;
        if (game.player1.id === userId) {
            winnerId = game.player2.id;
        } else if (game.player2.id === userId) {
            winnerId = game.player1.id;
        } else {
            console.error(`[Forfeit] User ${userId} tried to forfeit game ${gameId} they are not part of.`); 
            socket.emit('error', { message: 'Cannot forfeit game you are not playing.' });
            return;
        }

        try {
            const finalizedGame = await finalizeGame(gameId, 'disconnect', { winnerId: winnerId });

            if (finalizedGame) {
                activeGames.set(gameId, finalizedGame);

                const gameEndData = {
                    gameId: gameId,
                    status: finalizedGame.status,
                    winner: finalizedGame.winner,
                    reason: `Opponent forfeited`
                };
                io.to(`game_${gameId}`).emit('game_end', gameEndData);

                activeGames.delete(gameId);

            } else { 
                 console.error(`[Forfeit] finalizeGame returned null for game ${gameId} on forfeit.`); 
                 io.to(`game_${gameId}`).emit('error', { message: 'Error finalizing game state after forfeit.'});
            }
        } catch(finalizeError) {
             console.error(`[Forfeit] Error calling finalizeGame for ${gameId} on forfeit:`, finalizeError); 
             io.to(`game_${gameId}`).emit('error', { message: 'Server error ending game after forfeit.'});
        }
    });
    
    socket.on('cancel_match', () => {
        const userId = socket.data?.user?.id;
        const username = socket.data?.user?.username;
                
        const initialLength = waitingPlayers.length;
        waitingPlayers = waitingPlayers.filter(player => player.socketId !== socket.id);
        
        if(waitingPlayers.length < initialLength) {
            
        } else {
             
        }
    });

  });

  return io;
};

module.exports = { setupSocket }; 
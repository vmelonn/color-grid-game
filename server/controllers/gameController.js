const Game = require('../models/Game');
const User = require('../models/User');
const { maxAreaOfIsland } = require('../utils/maxAreaOfIsland.js');

exports.finalizeGame = async (gameId, resultType, 
                              options = {}
                             ) => {
    const { finalGrid, winnerId: disconnectWinnerId } = options;

    try {
        const game = await Game.findById(gameId).lean();
        if (!game || game.status === 'finished') {
            return null;
        }

        let winnerId = null;
        let loserId = null;
        let finalResult = 'draw';
        let gridToUse = game.grid;

        let updateData = {
            status: 'finished',
            finishedAt: new Date()
        };
        let player1Update = { $inc: {} };
        let player2Update = { $inc: {} };

        const player1Id = game.player1.id.toString();
        const player2Id = game.player2.id.toString();
        const player1Color = game.player1.color;
        const player2Color = game.player2.color;

        if (resultType === 'disconnect') {
            if (!disconnectWinnerId) throw new Error('Winner ID required for disconnect.');
            winnerId = disconnectWinnerId;
            loserId = (winnerId === player1Id) ? player2Id : player1Id;
            finalResult = 'win';
        } else {
            if (!finalGrid) {
                 
            } else {
                gridToUse = finalGrid;
            }
            const player1Area = maxAreaOfIsland(gridToUse, player1Color);
            const player2Area = maxAreaOfIsland(gridToUse, player2Color);
            
            if (player1Area > player2Area) {
                winnerId = player1Id;
                loserId = player2Id;
                finalResult = 'win';
            } else if (player2Area > player1Area) {
                winnerId = player2Id;
                loserId = player1Id;
                finalResult = 'win';
            } else {
                finalResult = 'draw';
            }
        }

        updateData.winner = (finalResult === 'win') ? winnerId : 'draw';
        updateData.grid = gridToUse;

        if (finalResult === 'win') {
            const winnerUpdate = { $inc: { wins: 1, coins: 200 } };
            const loserUpdate = { $inc: { losses: 1 } };

            if (winnerId === player1Id) {
                player1Update = winnerUpdate;
                player2Update = loserUpdate;
            } else {
                player1Update = loserUpdate;
                player2Update = winnerUpdate;
            }
            
            const loser = await User.findById(loserId).select('coins').lean();
            const loserCoinChange = Math.min(loser.coins || 0, 200);
            if (loserCoinChange > 0) {
                 if (loserId === player1Id) {
                     player1Update.$inc.coins = -loserCoinChange;
                 } else {
                     player2Update.$inc.coins = -loserCoinChange;
                 }
            }

        } else {
            player1Update = { $inc: { draws: 1 } };
            player2Update = { $inc: { draws: 1 } };
        }

        const updatedGame = await Game.findByIdAndUpdate(gameId, updateData, { new: true }).lean();
        
        await User.findByIdAndUpdate(player1Id, player1Update);
        await User.findByIdAndUpdate(player2Id, player2Update);
        
        return updatedGame;

    } catch (error) {
        console.error(`[FinalizeGame] Error finalizing game ${gameId}:`, error); 
        throw error;
    }
};

exports.getGameHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const games = await Game.find({
      status: 'finished',
      $or: [{ 'player1.id': userId }, { 'player2.id': userId }] 
    })
    .populate('player1.id', 'username profilePictureUrl')
    .populate('player2.id', 'username profilePictureUrl')
    .sort({ finishedAt: -1 })
    .limit(20);

    res.json(games);
  } catch (error) {
    console.error("Error fetching game history:", error); 
    res.status(500).json({ message: 'Failed to fetch game history.' });
  }
};

exports.getGameDetails = async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;

    const game = await Game.findOne({
      _id: gameId,
      status: 'finished',
      $or: [{ 'player1.id': userId }, { 'player2.id': userId }]
    })
    .populate('player1.id', 'username profilePictureUrl')
    .populate('player2.id', 'username profilePictureUrl');

    if (!game) {
      return res.status(404).json({ message: 'Game not found or you were not a player.' });
    }

    res.json(game);
  } catch (error) {
    console.error(`Error fetching details for game ${gameId}:`, error); 
    res.status(500).json({ message: 'Failed to fetch game details.' });
  }
}; 
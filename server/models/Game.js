const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    socketId: { type: String, required: true },
    username: { type: String, required: true },
    color: { type: String, enum: ['red', 'blue'], required: true }
}, { _id: false });

const gameSchema = new mongoose.Schema({
    player1: { type: playerSchema, required: true },
    player2: { type: playerSchema, required: true },
    grid: {
        type: [[String]], // Array of arrays of strings (or null, handled by logic)
        required: true,
        default: () => Array(5).fill(null).map(() => Array(5).fill(null)) // Default 5x5 grid
    },
    currentTurn: {
        type: String,
        enum: ['player1', 'player2'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'finished'],
        default: 'active',
        required: true
    },
    winner: {
        // Can be null (if active), 'draw', or the ObjectId of the winning user
        type: mongoose.Schema.Types.Mixed, 
        default: null 
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    finishedAt: {
        type: Date
    }
});

const Game = mongoose.model('Game', gameSchema);

module.exports = Game; 
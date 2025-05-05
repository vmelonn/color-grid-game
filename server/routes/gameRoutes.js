const express = require('express');
const { getGameHistory, getGameDetails } = require('../controllers/gameController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Protected routes
router.get('/history', authenticateToken, getGameHistory);
router.get('/history/:gameId', authenticateToken, getGameDetails);

module.exports = router; 
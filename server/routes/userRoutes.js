const express = require('express');
const { signup, login, updateProfile, getLeaderboard } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/test', (req, res) => {
  res.json({ message: "User routes are working!" });
});

router.post('/signup', (req, res, next) => {
  signup(req, res, next);
});

router.post('/login', login);

router.get('/leaderboard', getLeaderboard);
router.put('/profile', authenticateToken, updateProfile);

module.exports = router; 
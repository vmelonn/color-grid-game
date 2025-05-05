const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { username, password, profile_picture_url } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Username already exists',
        error: 'USERNAME_EXISTS'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      password: hashedPassword,
      profilePicture: profile_picture_url || '',
      coins: 1000
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
        coins: user.coins
      }
    });
  } catch (error) {
    console.error('Signup error:', error); 
    if (error.code === 11000) {
      res.status(400).json({ 
        message: 'Username already exists',
        error: 'USERNAME_EXISTS'
      });
    } else {
      res.status(500).json({ 
        message: 'Error creating user', 
        error: error.message 
      });
    }
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS'
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
        coins: user.coins
      }
    });
  } catch (error) {
    console.error('Login error:', error); 
    res.status(500).json({ 
      message: 'Error logging in', 
      error: error.message 
    });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const { userId } = req.body;
    const updates = {
      username: req.body.username,
      profilePicture: req.body.profile_picture_url
    };

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
        coins: user.coins
      }
    });
  } catch (error) {
    console.error('Profile update error:', error); 
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

module.exports = router;

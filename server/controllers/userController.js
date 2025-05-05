const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
  try {
    const { username, password, profile_picture_url } = req.body;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashedPassword,
      profile_picture_url: profile_picture_url || ''
      // Default coins are set in the model schema
    });
    
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        profile_picture_url: user.profile_picture_url,
        coins: user.coins
      }
    });
  } catch (error) {
    console.error("Signup error:", error); 
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        profile_picture_url: user.profile_picture_url,
        coins: user.coins
      }
    });
  } catch (error) {
    console.error("Login error:", error); 
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, password, profile_picture_url } = req.body;
    const userId = req.user.id;

    const updates = {};
    if (username) updates.username = username;
    if (password) updates.password = await bcrypt.hash(password, 10);
    if (profile_picture_url) updates.profile_picture_url = profile_picture_url;

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, select: '-password' }
    );

    res.json(user);
  } catch (error) {
    console.error("Update profile error:", error); 
    res.status(500).json({ message: error.message });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        username: { $regex: search, $options: 'i' }
      };
    }

    const users = await User.find(query)
      .select('username profile_picture_url coins wins losses draws')
      .sort({ coins: -1 })
      .limit(10);

    res.json(users);
  } catch (error) {
    console.error("Get leaderboard error:", error); 
    res.status(500).json({ message: error.message });
  }
}; 
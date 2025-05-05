const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { setupSocket } = require('./socket');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, './config.env') });

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/colorgrid')
  .then(() => {})
  .catch(err => { console.error('MongoDB connection error:', err); });

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userRoutes');
const gameRoutes = require('./routes/gameRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);

const server = app.listen(PORT, () => {
});

setupSocket(server); 
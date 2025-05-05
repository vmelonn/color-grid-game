import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import { Welcome } from './pages/Welcome';
import Login from './pages/Login';
import { Signup } from './pages/Signup';
import { Home } from './pages/Home';
import WaitingRoom from './pages/WaitingRoom';
import Game from './pages/Game';
import History from './pages/History.tsx';
import { HistoryDetail } from './pages/HistoryDetail';
import { Profile } from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
              <Route path="/newgame/waiting" element={<PrivateRoute><WaitingRoom /></PrivateRoute>} />
              <Route path="/game/:gameId" element={<PrivateRoute><Game /></PrivateRoute>} />
              <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
              <Route path="/history/:gameId" element={<PrivateRoute><HistoryDetail /></PrivateRoute>} />
              <Route path="/update-profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;

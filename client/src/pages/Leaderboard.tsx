import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import debounce from 'lodash.debounce';
import './Leaderboard.css';

interface LeaderboardUser {
  _id: string;
  username: string;
  profilePictureUrl?: string;
  wins: number;
  losses: number;
  draws: number;
  coins: number;
}

const Leaderboard: React.FC = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLeaderboard = useCallback(debounce(async (search: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<LeaderboardUser[]>('/api/users/leaderboard', {
        params: { search: search || undefined }
      });
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch leaderboard.');
    } finally {
      setLoading(false);
    }
  }, 300), []);

  useEffect(() => {
    fetchLeaderboard(searchTerm);
    return () => {
      fetchLeaderboard.cancel();
    };
  }, [searchTerm, fetchLeaderboard]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (loading) {
    return (
      <main className="leaderboard-container">
        <h2>Leaderboard</h2>
        <p>Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="leaderboard-container">
        <h2>Leaderboard</h2>
        <p className="error-message">{error}</p>
      </main>
    );
  }

  return (
    <div className="leaderboard-container">
      <h1>Leaderboard</h1>
      <Link to="/home" className="back-link">Back to Home</Link>
      <div className="search-container">
        <input 
          type="text" 
          placeholder="Search users..." 
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>
      {!loading && !error && (
        users.length === 0 ? (
          <p>{searchTerm ? 'No users found matching your search.' : 'Leaderboard is empty.'}</p>
        ) : (
          <ol className="leaderboard-list">
            {users.map((user, index) => (
              <li key={user._id} className="leaderboard-item">
                <span className="rank">{index + 1}</span>
                <img 
                  src={user.profilePictureUrl || '/default-avatar.png'} 
                  alt={user.username}
                  className="avatar"
                />
                <span className="username">{user.username}</span>
                <div className="stats">
                  <span title="Wins" className="stat wins">W: {user.wins}</span>
                  <span title="Losses" className="stat losses">L: {user.losses}</span>
                  <span title="Draws" className="stat draws">D: {user.draws}</span>
                </div>
                <span className="coins" title="Coins">
                  🪙 {user.coins}
                </span>
              </li>
            ))}
          </ol>
        )
      )}
    </div>
  );
};

export default Leaderboard;

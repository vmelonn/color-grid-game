import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Home = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Please login to continue</div>;
  }

  return (
    <div className="home-container">
      <h2>Welcome, {user.username}!</h2>
      <div className="game-options">
        <Link to="/newgame/waiting" className="game-option">
          Play Game
        </Link>
        <Link to="/leaderboard" className="game-option">
          Leaderboard
        </Link>
        <Link to="/history" className="game-option">
          Game History
        </Link>
      </div>
    </div>
  );
}; 
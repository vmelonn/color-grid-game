import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!user) {
    return null;
  }
  
  const userCoins = user.coins ?? 0;

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/home" className="navbar-brand">
          ColorGrid 
        </Link>
      </div>
      <div className="navbar-right">
        <div className="nav-item coin-balance" title="Your Coins">
           🪙 {userCoins}
        </div>

        <Link to="/history" className="nav-link">History</Link>
        <Link to="/leaderboard" className="nav-link">Leaderboard</Link>

        <div className="nav-item user-profile" onClick={() => setDropdownOpen(!dropdownOpen)}>
          <img
            src={user.profilePictureUrl || '/default-avatar.png'}
            alt="Profile"
            className="profile-pic"
          />
          <span className="username">{user.username}</span>
          <span className={`dropdown-caret ${dropdownOpen ? 'open' : ''}`}>▼</span>
          
          {dropdownOpen && (
             <div className="dropdown-menu">
                <Link 
                    to="/update-profile" 
                    className="dropdown-item" 
                    onClick={() => setDropdownOpen(false)}
                >
                  Update Profile
                </Link>
                <button 
                    onClick={() => { logout(); setDropdownOpen(false); }} 
                    className="dropdown-item logout-button"
                >
                  Logout
                </button>
             </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 
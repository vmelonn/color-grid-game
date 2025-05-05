import React from 'react';
import { Link } from 'react-router-dom';

export const Welcome: React.FC = () => {
  return (
    <div className="welcome-container">
      <h1>Welcome to ColorGrid</h1>
      <p>A 2-player, turn-based color conquest game</p>
      <div className="welcome-buttons">
        <Link to="/login" className="welcome-button">
          Login
        </Link>
        <Link to="/signup" className="welcome-button">
          Sign Up
        </Link>
      </div>
    </div>
  );
}; 
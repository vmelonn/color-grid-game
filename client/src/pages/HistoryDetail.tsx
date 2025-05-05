import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './HistoryDetail.css';

interface PlayerDetail {
    _id: string;
    username: string;
    profilePictureUrl?: string;
}

interface PlayerInfo {
    id: PlayerDetail;
    color: string;
    username: string;
    socketId?: string;
}

interface DetailedGame {
    _id: string;
    player1: PlayerInfo;
    player2: PlayerInfo;
    status: 'finished';
    winner: string | 'draw';
    grid: (string | null)[][];
    finishedAt: string;
    createdAt: string;
}

const GameGridDisplay: React.FC<{ grid: (string | null)[][] }> = ({ grid }) => {
    return (
        <div className="history-grid">
            {grid.map((row, rowIndex) => (
                <div key={rowIndex} className="grid-row">
                    {row.map((cell, colIndex) => (
                        <div
                            key={`${rowIndex}-${colIndex}`}
                            className={`grid-cell ${cell || 'empty'}`}
                        >
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export const HistoryDetail: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { user } = useAuth();
  const [game, setGame] = useState<DetailedGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGame = async () => {
      if (!gameId) {
          setError('No game ID provided.');
          setLoading(false);
          return;
      }
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
          setError('Authentication required.');
          setLoading(false);
          return;
      }

      try {
        const response = await axios.get<DetailedGame>(`/api/games/history/${gameId}`, {
             headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        setGame(response.data);
      } catch (err: any) {
         setError(err.response?.data?.message || 'Failed to load game details.');
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [gameId]);

  const getGameResult = () => {
    if (!game || !user) return '';
    if (game.winner === 'draw') return 'Draw';
    if (game.winner === user.id) return 'You Won';
    return 'You Lost';
  };

  const getOpponentInfo = (): PlayerDetail | null => {
    if (!game || !user) return null;
    if (game.player1.id._id === user.id) return game.player2.id;
    if (game.player2.id._id === user.id) return game.player1.id;
    return null;
  };

  const opponentInfo = getOpponentInfo();

  return (
    <main className="history-detail-container">
      <h2>Game Details</h2>
      <Link to="/history" className="back-link">Back to History</Link>
      
      {loading && <p>Loading game details...</p>}
      {error && <p className="error-message">Error: {error}</p>}
      
      {!loading && !error && game && (
        <>
          <div className="game-info-header">
             <p>Game ID: {game._id}</p>
             <p>Played on: {new Date(game.finishedAt || game.createdAt).toLocaleDateString()}</p>
             <p>Opponent: {opponentInfo ? opponentInfo.username : 'Unknown'}</p>
             <p>Result: {getGameResult()}</p>
          </div>
          
          <h3>Final Board State:</h3>
          <div className="game-grid-container">
             <GameGridDisplay grid={game.grid} />
          </div>
        </>
      )}
       {!loading && !error && !game && (
            <p>Game not found.</p>
       )}
    </main>
  );
};

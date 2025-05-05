import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // To potentially get token
import './GameHistory.css'; // We'll create this CSS file later

// Define interfaces based on expected API response (matching Game model)
interface PlayerInfo {
    id: {
        _id: string;
        username: string;
        profilePictureUrl?: string;
    };
    color: string;
    username: string; // Keep username at top level too if Game model has it
}

interface GameHistoryEntry {
    _id: string;
    player1: PlayerInfo;
    player2: PlayerInfo;
    status: 'finished';
    winner: string | 'draw'; // User ID or 'draw'
    finishedAt: string; // Date string
    createdAt: string; // Date string
}

const History: React.FC = () => {
    const [games, setGames] = useState<GameHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth(); // Get current user to compare IDs

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication required.');
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get<GameHistoryEntry[]>('/api/games/history', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setGames(response.data);
            } catch (err: any) {
                console.error("Error fetching game history:", err);
                setError(err.response?.data?.message || 'Failed to fetch game history.');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []); // Run only on mount

    const renderGameResult = (game: GameHistoryEntry) => {
        if (!user) return '-'; // Should not happen if token exists, but safety check

        if (game.winner === 'draw') {
            return <span className="result-draw">Draw</span>;
        }
        if (game.winner === user.id) {
            return <span className="result-win">Win</span>;
        } 
        return <span className="result-loss">Loss</span>;
    };

    const getOpponent = (game: GameHistoryEntry): PlayerInfo['id'] | null => {
        if (!user) return null;
        if (game.player1.id._id === user.id) {
            return game.player2.id;
        }
        if (game.player2.id._id === user.id) {
            return game.player1.id;
        }
        return null; // Should not happen for games fetched by history endpoint
    };

    return (
        <div className="game-history-container">
            <h1>Game History</h1>
            <Link to="/home" className="back-link">Back to Home</Link>
            {loading && <p>Loading history...</p>}
            {error && <p className="error-message">Error: {error}</p>}
            {!loading && !error && (
                games.length === 0 ? (
                    <p>No games played yet.</p>
                ) : (
                    <ul className="game-list">
                        {games.map((game) => {
                            const opponent = getOpponent(game);
                            return (
                                <li key={game._id} className="game-item">
                                    <div className="game-info">
                                        <span className="opponent-name">
                                            vs {opponent ? opponent.username : 'Unknown'}
                                        </span>
                                        <span className="game-date">
                                            {new Date(game.finishedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="game-result">
                                        {renderGameResult(game)}
                                    </div>
                                    {/* Optional: Link to detailed view? */}
                                    {/* <Link to={`/game/details/${game._id}`}>Details</Link> */}
                                </li>
                            );
                        })}
                    </ul>
                )
            )}
        </div>
    );
};

export default History; 
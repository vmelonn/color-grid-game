import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './History.css';

interface PlayerInfo {
    id: {
        _id: string;
        username: string;
        profilePictureUrl?: string;
    };
    color: string;
    username: string;
}

interface GameHistoryEntry {
    _id: string;
    player1: PlayerInfo;
    player2: PlayerInfo;
    status: 'finished';
    winner: string | 'draw';
    finishedAt: string;
    createdAt: string;
}

const History: React.FC = () => {
    const [games, setGames] = useState<GameHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

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
                setError(err.response?.data?.message || 'Failed to fetch game history.');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const renderGameResultText = (game: GameHistoryEntry): string => {
        if (!user) return 'Unknown';
        if (game.winner === 'draw') return 'Draw';
        return game.winner === user.id ? 'Won' : 'Lost';
    };

    const getOpponent = (game: GameHistoryEntry): PlayerInfo['id'] | null => {
        if (!user) return null;
        if (game.player1.id._id === user.id) {
            return game.player2.id;
        }
        if (game.player2.id._id === user.id) {
            return game.player1.id;
        }
        return null;
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
                            const resultText = renderGameResultText(game);
                            return (
                                <li key={game._id} className="game-item">
                                    <span className="game-summary">
                                        Game #{game._id.substring(game._id.length - 6)}
                                        vs {opponent ? opponent.username : 'Unknown'}
                                        <span className={`result-text result-${resultText.toLowerCase()}`}>{resultText}</span>
                                    </span>
                                    <Link to={`/history/${game._id}`} className="details-link">Details</Link>
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

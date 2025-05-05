// API Types
export interface User {
  _id: string;
  username: string;
  profile_picture_url?: string;
  coins: number;
}

export interface Game {
  _id: string;
  player1_id: string;
  player2_id: string;
  player1_username: string;
  player2_username: string;
  player1_color: string;
  player2_color: string;
  final_grid: string[][];
  result: string;
  winner_id: string | null;
}

export interface PlayerStats {
  _id: string;
  username: string;
  profile_picture_url?: string;
  coins: number;
  wins: number;
  losses: number;
  draws: number;
}

// Socket Event Types
export interface PlayerInfo {
  username: string;
  color: string;
}

export interface GameStartData {
  gameId: string;
  player1: PlayerInfo;
  player2: PlayerInfo;
}

export interface MatchFoundData {
  gameId: string;
  player1: PlayerInfo;
  player2: PlayerInfo;
}

export interface MoveData {
  row: number;
  col: number;
  color: string;
}

export interface GameEndData {
  winner: string | null;
  coins: number;
} 
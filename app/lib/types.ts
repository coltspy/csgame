// app/lib/types.ts

export interface GameScore {
  timeLeft: number;
  complexity: number;
  total: number;
  place?: number;
  completedAt: Date;
}

export type GameType = 'password' | 'network' | 'encryption';

export interface PlayerStats {
  totalGames: number;
  wins: number;
  totalScore: number;
  bestTime: number;
  averagePlace: number;
}

export interface Player {
  id: string;
  name: string;
  joinedAt: Date;
  score: GameScore | null;
  hasSubmitted: boolean;
  stats: PlayerStats;
}

export interface Room {
  id?: string;
  name: string;
  password: string;
  creatorId: string;
  players: Player[];
  gameState: {
    type: GameType;
    round: number;
    status: 'waiting' | 'playing' | 'roundEnd';
    startTime?: Date;
    roundHistory?: {
      gameType: GameType;
      winners: string[];
      scores: Record<string, GameScore>;
    }[];
  };
  allSubmitted: boolean;
}
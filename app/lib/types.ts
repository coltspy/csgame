// app/lib/types.ts

export interface GameScore {
  timeLeft: number;
  complexity: number;
  total: number;
}

export type GameType = 'password' | 'network' | 'encryption';

export interface Player {
  id: string;
  name: string;
  joinedAt: Date;
  score: GameScore | null;
  hasSubmitted: boolean;
  totalScore?: number;
}

export interface Room {
  id?: string;
  name: string;
  password: string;
  creatorId: string;
  players: Player[];
  gameState: {
    round: number;
    status: 'waiting' | 'playing' | 'roundEnd';
    gameType?: GameType;
    currentQuestion?: number;
    startTime?: Date;
  };
  allSubmitted: boolean;
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswers: string[];
  points: number;
}

export interface Round {
  number: number;
  title: string;
  description: string;
  questions: Question[];
  timeLimit: number;
}
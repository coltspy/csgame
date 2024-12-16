// app/components/Leaderboard.tsx
'use client';

import { motion } from "framer-motion";
import { Trophy, Award, Star } from 'lucide-react';
import type { Player } from '@/app/lib/types';

interface LeaderboardProps {
  players: Player[];
  isInGame?: boolean;
  showStats?: boolean;
}

export function Leaderboard({ players, isInGame = false, showStats = true }: LeaderboardProps) {
  const sortedPlayers = [...players]
    .sort((a, b) => {
      if (isInGame) {
        // During game sorting
        if (!a.score && !b.score) return 0;
        if (!a.score) return 1;
        if (!b.score) return -1;
        return b.score.total - a.score.total;
      } else {
        // Overall stats sorting
        const aScore = a.stats?.totalScore || 0;
        const bScore = b.stats?.totalScore || 0;
        return bScore - aScore;
      }
    });

  return (
    <div className="space-y-4">
      {sortedPlayers.map((player, index) => (
        <motion.div
          key={player.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`p-4 rounded-lg ${
            index === 0 ? 'bg-yellow-900/50 border-yellow-500/50' :
            index === 1 ? 'bg-gray-600/50 border-gray-400/50' :
            index === 2 ? 'bg-amber-900/50 border-amber-500/50' :
            'bg-blue-900/20 border-blue-500/30'
          } border`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl font-bold">{index + 1}</span>
              <div>
                <span className="font-semibold">{player.name}</span>
                {!isInGame && player.stats && (
                  <div className="text-sm text-gray-400 mt-1">
                    Win Rate: {((player.stats.wins / Math.max(1, player.stats.totalGames)) * 100).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right">
              {isInGame ? (
                player.score ? (
                  <div>
                    <div className="text-xl font-bold">
                      {player.score.total.toFixed(0)} pts
                    </div>
                    <div className="text-sm text-gray-400">
                      Time: {player.score.timeLeft}s
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-400">Playing...</span>
                )
              ) : (
                player.stats && (
                  <div>
                    <div className="text-xl font-bold">
                      {player.stats.totalScore} pts
                    </div>
                    <div className="flex items-center justify-end space-x-4 mt-1">
                      <div className="text-sm text-gray-400 flex items-center">
                        <Trophy className="h-4 w-4 mr-1" />
                        {player.stats.wins}/{player.stats.totalGames}
                      </div>
                      <div className="text-sm text-gray-400 flex items-center">
                        <Star className="h-4 w-4 mr-1" />
                        {player.stats.bestTime}s
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </motion.div>
      ))}

      {!isInGame && sortedPlayers.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No games played yet.</p>
          <p className="text-sm mt-2">Start a game to begin building the leaderboard!</p>
        </div>
      )}
    </div>
  );
}
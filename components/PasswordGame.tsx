// app/components/PasswordGame.tsx
'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Clock, Shield, Trophy, X } from 'lucide-react';
import type { Room, Player, GameScore } from '@/app/lib/types';

interface PasswordGameProps {
  roomId: string;
  room: Room;
  playerId: string | null;  // Update to allow null
}

const requirements = [
  { id: 1, text: "At least 12 characters long", check: (pwd: string) => pwd.length >= 12 },
  { id: 2, text: "Contains uppercase letter", check: (pwd: string) => /[A-Z]/.test(pwd) },
  { id: 3, text: "Contains lowercase letter", check: (pwd: string) => /[a-z]/.test(pwd) },
  { id: 4, text: "Contains number", check: (pwd: string) => /[0-9]/.test(pwd) },
  { id: 5, text: "Contains special character (!@#$%^&*)", check: (pwd: string) => /[!@#$%^&*]/.test(pwd) },
  { id: 6, text: "No repeating characters (e.g., 'aaa')", check: (pwd: string) => !/(.)\1\1/.test(pwd) }
];

export default function PasswordGame({ roomId, room, playerId }: PasswordGameProps) {
  const [password, setPassword] = useState('');
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!submitted) {
        setTimeLeft(prev => {
          if (prev <= 0) {
            submitPassword('', 0);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [submitted]);

  const calculateComplexityScore = (pwd: string): number => {
    let score = 0;
    // Length bonus
    if (pwd.length >= 15) score += 20;
    // Multiple uppercase
    if (/[A-Z].*[A-Z]/.test(pwd)) score += 10;
    // Multiple lowercase
    if (/[a-z].*[a-z]/.test(pwd)) score += 10;
    // Multiple numbers
    if (/[0-9].*[0-9]/.test(pwd)) score += 10;
    // Multiple special chars
    if (/[!@#$%^&*].*[!@#$%^&*]/.test(pwd)) score += 20;
    // No repeating chars
    if (!/(.)\1\1/.test(pwd)) score += 10;
    // Extra characters
    if (/[^A-Za-z0-9!@#$%^&*]/.test(pwd)) score += 20;
    return score;
  };

  const checkRequirement = (req: typeof requirements[0]) => req.check(password);
  const allRequirementsMet = () => requirements.every(checkRequirement);

  const submitPassword = async (pwd: string, complexityScore: number) => {
    const roomRef = doc(db, 'rooms', roomId);
    
    const score: GameScore = {
      timeLeft,
      complexity: complexityScore,
      total: timeLeft + complexityScore
    };

    const updatedPlayers = room.players.map(p => 
      p.id === playerId 
        ? { ...p, score, hasSubmitted: true }
        : p
    );

    const allSubmitted = updatedPlayers.every(p => p.hasSubmitted);

    await updateDoc(roomRef, {
      players: updatedPlayers,
      allSubmitted,
      'gameState.status': allSubmitted ? 'roundEnd' : 'playing'
    });

    setSubmitted(true);
  };

  const handleSubmit = () => {
    if (allRequirementsMet()) {
      const complexityScore = calculateComplexityScore(password);
      submitPassword(password, complexityScore);
    }
  };

  const sortedPlayers = [...room.players].sort((a, b) => 
    (b.score?.total || 0) - (a.score?.total || 0)
  );

  if (submitted && !room.allSubmitted) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-green-400 flex items-center">
            <Trophy className="mr-2 h-5 w-5" />
            Waiting for other players...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedPlayers.map((player, index) => (
              <div 
                key={player.id} 
                className={`p-4 rounded-lg flex items-center justify-between ${
                  player.id === playerId ? 'bg-blue-900' : 'bg-gray-700'
                }`}
              >
                <span className="flex items-center">
                  {index + 1}. {player.name}
                </span>
                {player.hasSubmitted ? 
                  <Check className="h-5 w-5 text-green-500" /> : 
                  <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />
                }
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      <Card className="col-span-2 bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-green-400 flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Create a Secure Password - Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="bg-gray-700 border-gray-600 text-gray-100 mb-4"
          />
          <div className="space-y-2">
            {requirements.map(req => (
              <div key={req.id} className="flex items-center text-gray-200">
                {checkRequirement(req) ? (
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <X className="h-4 w-4 text-red-500 mr-2" />
                )}
                {req.text}
              </div>
            ))}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!allRequirementsMet()}
            className="mt-6 bg-blue-600 hover:bg-blue-700 w-full"
          >
            Submit Password
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-blue-400 flex items-center">
            <Trophy className="mr-2 h-5 w-5" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedPlayers.map((player, index) => (
              <div 
                key={player.id} 
                className={`p-3 rounded-lg ${
                  player.id === playerId ? 'bg-blue-900' : 'bg-gray-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>{index + 1}. {player.name}</span>
                  {player.score && (
                    <span className="text-sm">
                      Total: {player.score.total}
                    </span>
                  )}
                </div>
                {player.score && (
                  <div className="text-xs text-gray-400 mt-1">
                    Time: {player.score.timeLeft}s | Complexity: {player.score.complexity}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
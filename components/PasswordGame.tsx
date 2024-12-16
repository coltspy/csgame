
'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Clock, Shield, Trophy, X } from 'lucide-react';
import { Leaderboard } from '@/components/Leaderboard';
import type { Room, GameScore } from '@/app/lib/types';

interface PasswordGameProps {
  roomId: string;
  room: Room;
  playerId: string;
}

const requirements = [
  { id: 1, text: "At least 12 characters long", check: (pwd: string) => pwd.length >= 12 },
  { id: 2, text: "Contains uppercase letter", check: (pwd: string) => /[A-Z]/.test(pwd) },
  { id: 3, text: "Contains lowercase letter", check: (pwd: string) => /[a-z]/.test(pwd) },
  { id: 4, text: "Contains number", check: (pwd: string) => /[0-9]/.test(pwd) },
  { id: 5, text: "Contains special character (!@#$%^&*)", check: (pwd: string) => /[!@#$%^&*]/.test(pwd) },
  { id: 6, text: "No repeating characters (e.g., 'aaa')", check: (pwd: string) => !/(.)\1\1/.test(pwd) },
  { 
    id: 7, 
    text: "Must contain a number that's the sum of two previous numbers", 
    check: (pwd: string) => {
      const numbers = pwd.match(/\d+/g)?.map(Number);
      return numbers ? numbers.some((n, i) => i >= 2 && n === numbers[i-1] + numbers[i-2]) : false;
    }
  },
  { 
    id: 8, 
    text: "Must include a day of the week (capitalized)", 
    check: (pwd: string) => /Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/.test(pwd)
  },
  { 
    id: 9, 
    text: "Must contain alternating consonants and vowels somewhere", 
    check: (pwd: string) => /[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnpqrstvwxyz][aeiou]/i.test(pwd)
  },
  { 
    id: 10, 
    text: "Must include a mathematical operation (e.g., 2+2=4)", 
    check: (pwd: string) => /\d+[\+\-\*\/]\d+=\d+/.test(pwd)
  }
];

export default function PasswordGame({ roomId, room, playerId }: PasswordGameProps) {
  const [password, setPassword] = useState('');
  const [timeLeft, setTimeLeft] = useState(120);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

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
    if (pwd.length >= 15) score += 20;
    if (/[A-Z].*[A-Z]/.test(pwd)) score += 10;
    if (/[a-z].*[a-z]/.test(pwd)) score += 10;
    if (/[0-9].*[0-9]/.test(pwd)) score += 10;
    if (/[!@#$%^&*].*[!@#$%^&*]/.test(pwd)) score += 20;
    if (!/(.)\1\1/.test(pwd)) score += 10;
    if (/[^A-Za-z0-9!@#$%^&*]/.test(pwd)) score += 20;
    return score;
  };

  const checkRequirement = (req: typeof requirements[0]) => req.check(password);
  const allRequirementsMet = () => requirements.every(checkRequirement);

  const submitPassword = async (pwd: string, complexityScore: number) => {
    try {
      // Get current room data for accurate placement
      const roomRef = doc(db, 'rooms', roomId);
      const roomSnap = await getDoc(roomRef);
      const roomData = roomSnap.data() as Room;

      // Calculate place based on existing submissions
      const submittedPlayers = roomData.players.filter(p => p.score);
      const place = submittedPlayers.length + 1;

      const score: GameScore = {
        timeLeft,
        complexity: complexityScore,
        total: timeLeft + complexityScore,
        place,
        completedAt: new Date()
      };

      const currentPlayer = roomData.players.find(p => p.id === playerId);
      if (!currentPlayer) return;

      const updatedPlayers = roomData.players.map(p => 
        p.id === playerId 
          ? { 
              ...p, 
              score, 
              hasSubmitted: true,
              stats: {
                totalGames: (p.stats?.totalGames || 0) + 1,
                wins: place === 1 ? (p.stats?.wins || 0) + 1 : (p.stats?.wins || 0),
                totalScore: (p.stats?.totalScore || 0) + score.total,
                bestTime: p.stats?.bestTime ? Math.max(p.stats.bestTime, score.timeLeft) : score.timeLeft,
                averagePlace: p.stats?.totalGames 
                  ? ((p.stats.averagePlace * p.stats.totalGames + place) / (p.stats.totalGames + 1))
                  : place
              }
            }
          : p
      );

      const allSubmitted = updatedPlayers.every(p => p.hasSubmitted);

      // Update room
      await updateDoc(roomRef, {
        players: updatedPlayers,
        allSubmitted,
        ...(allSubmitted ? {
          'gameState.status': 'roundEnd',
          'roundHistory': arrayUnion({
            gameType: 'password',
            winners: updatedPlayers
              .filter(p => p.score?.place === 1)
              .map(p => p.id),
            scores: Object.fromEntries(
              updatedPlayers
                .filter(p => p.score)
                .map(p => [p.id, p.score])
            )
          })
        } : {})
      });

      setSubmitted(true);

      // If all submitted, automatically return to lobby after delay
      if (allSubmitted) {
        setTimeout(() => {
          updateDoc(roomRef, {
            'gameState.status': 'waiting',
            'gameState.round': roomData.gameState.round + 1,
            players: updatedPlayers.map(p => ({
              ...p,
              score: null,
              hasSubmitted: false
            }))
          });
        }, 5000);
      }
    } catch (error) {
      console.error('Failed to submit password:', error);
      setError('Failed to submit. Please try again.');
    }
  };

  if (room.allSubmitted || (submitted && room.players.every(p => p.hasSubmitted))) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-green-400 flex items-center">
            <Trophy className="mr-2 h-5 w-5" />
            Game Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Leaderboard 
            players={room.players}
            isInGame={true}
            showStats={false}
          />
        </CardContent>
      </Card>
    );
  } else if (submitted) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-green-400 flex items-center">
            <Trophy className="mr-2 h-5 w-5" />
            Waiting for other players...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Leaderboard 
            players={room.players}
            isInGame={true}
            showStats={false}
          />
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
          {error && (
            <div className="text-red-400 mt-4">
              {error}
            </div>
          )}
          <Button
            onClick={() => submitPassword(password, calculateComplexityScore(password))}
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
            Current Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Leaderboard 
            players={room.players}
            isInGame={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
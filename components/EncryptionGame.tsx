// app/components/EncryptionGame.tsx
'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Clock, Trophy, Key, AlertCircle } from 'lucide-react';
import { Leaderboard } from '@/components/Leaderboard';
import type { Room, GameScore } from '@/app/lib/types';

interface EncryptionGameProps {
  roomId: string;
  room: Room;
  playerId: string;
}

interface Challenge {
  encryptedMessage: string;
  key: string;
  correctAnswer: string;
  hint: string;
  type: 'caesar' | 'vigenere' | 'reverse' | 'substitution';
  points: number;
}

const challenges: Challenge[] = [
  {
    encryptedMessage: "KHOOR ZRUOG",
    key: "3",
    correctAnswer: "HELLO WORLD",
    hint: "Caesar cipher - shift each letter backward by the key number (A→X, B→Y, C→Z)",
    type: 'caesar',
    points: 100
  },
  {
    encryptedMessage: "XLMW MW E WIGYVMXC XIWX",
    key: "4",
    correctAnswer: "THIS IS A SECURITY TEST",
    hint: "Caesar cipher - each letter is shifted by 4 positions",
    type: 'caesar',
    points: 150
  }
];

export default function EncryptionGame({ roomId, room, playerId }: EncryptionGameProps) {
  const [timeLeft, setTimeLeft] = useState(180);
  const [submitted, setSubmitted] = useState(false);
  const [answer, setAnswer] = useState('');
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [error, setError] = useState('');
  const [currentScore, setCurrentScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!submitted) {
        setTimeLeft(prev => {
          if (prev <= 0) {
            submitAnswer();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [submitted]);

  const checkAnswer = (): number => {
    const challenge = challenges[currentChallenge];
    const userAnswer = answer.toUpperCase().trim();
    const isCorrect = userAnswer === challenge.correctAnswer;
    
    if (isCorrect) {
      const timeBonus = Math.floor(timeLeft / 10);
      const streakBonus = streak * 25;
      return challenge.points + timeBonus + streakBonus;
    }
    
    return 0;
  };

  const submitAnswer = async () => {
    try {
      const roomRef = doc(db, 'rooms', roomId);
      const roomSnap = await getDoc(roomRef);
      const roomData = roomSnap.data() as Room;

      const pointsEarned = checkAnswer();
      if (pointsEarned === 0) {
        setError('Incorrect answer. Try again!');
        setAttempts(prev => prev + 1);
        setStreak(0);
        return;
      }

      const submittedPlayers = roomData.players.filter(p => p.score);
      const place = submittedPlayers.length + 1;

      const newTotalScore = currentScore + pointsEarned;
      setCurrentScore(newTotalScore);
      setStreak(prev => prev + 1);

      const gameScore: GameScore = {
        timeLeft,
        complexity: pointsEarned,
        total: newTotalScore,
        place,
        completedAt: new Date()
      };

      const currentPlayer = roomData.players.find(p => p.id === playerId);
      if (!currentPlayer) return;

      const updatedPlayers = roomData.players.map(p => 
        p.id === playerId 
          ? { 
              ...p, 
              score: gameScore, 
              hasSubmitted: true,
              stats: {
                totalGames: (p.stats?.totalGames || 0) + 1,
                wins: place === 1 ? (p.stats?.wins || 0) + 1 : (p.stats?.wins || 0),
                totalScore: (p.stats?.totalScore || 0) + newTotalScore,
                bestTime: p.stats?.bestTime ? Math.max(p.stats.bestTime, timeLeft) : timeLeft,
                averagePlace: p.stats?.totalGames 
                  ? ((p.stats.averagePlace * p.stats.totalGames + place) / (p.stats.totalGames + 1))
                  : place
              }
            }
          : p
      );

      const allSubmitted = updatedPlayers.every(p => p.hasSubmitted);

      await updateDoc(roomRef, {
        players: updatedPlayers,
        allSubmitted,
        ...(allSubmitted ? {
          'gameState.status': 'roundEnd',
          'roundHistory': arrayUnion({
            gameType: 'encryption',
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
      console.error('Failed to submit answer:', error);
      setError('Failed to submit. Please try again.');
    }
  };

  const challenge = challenges[currentChallenge];

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
  } 

  if (submitted) {
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
          <CardTitle className="text-xl font-semibold text-blue-400 flex items-center justify-between">
            <div className="flex items-center">
              <Lock className="mr-2 h-5 w-5" />
              Decryption Challenge
            </div>
            <div className="flex items-center space-x-6">
              <div>Time: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
              <div>Score: {currentScore}</div>
              {streak > 1 && (
                <div className="text-yellow-400">
                  {streak}x Streak!
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-700 p-6 rounded-lg">
            <div className="mb-6">
              <span className="text-sm font-semibold text-blue-400 uppercase tracking-wide">
                Challenge Type: {challenge.type}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold mb-2">Encrypted Message:</h3>
            <p className="text-2xl font-mono mb-6 bg-gray-800 p-4 rounded border border-gray-600">
              {challenge.encryptedMessage}
            </p>
            
            <div className="flex items-center space-x-2 mb-4 bg-yellow-900/20 p-3 rounded-lg border border-yellow-500/30">
              <Key className="h-5 w-5 text-yellow-500" />
              <span className="font-mono">Decryption Key: {challenge.key}</span>
            </div>

            <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-500/30">
              <p className="text-sm text-gray-300">{challenge.hint}</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Enter decrypted message"
              value={answer}
              onChange={(e) => {
                setError('');
                setAnswer(e.target.value);
              }}
              className="bg-gray-700 border-gray-600 text-gray-100 font-mono text-lg h-12"
            />
            {error && (
              <div className="flex items-center text-red-400 text-sm bg-red-900/20 p-2 rounded">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            )}
            <Button
              onClick={submitAnswer}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
            >
              Submit Answer
            </Button>
          </div>
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
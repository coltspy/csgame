// app/components/NetworkDefenseGame.tsx
'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Trophy, Heart, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaderboard } from '@/components/Leaderboard';
import type { Room, GameScore } from '@/app/lib/types';

interface NetworkDefenseProps {
  roomId: string;
  room: Room;
  playerId: string;
}

interface Question {
  id: number;
  text: string;
  answers: string[];
  correct: number;
  points: number;
  category: 'firewall' | 'malware' | 'encryption' | 'protocol';
  timeLimit: number;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "An attacker is flooding your network with TCP SYN packets. What type of attack is this?",
    answers: [
      "SQL Injection",
      "SYN Flood Attack",
      "Cross-Site Scripting",
      "Man in the Middle"
    ],
    correct: 1,
    points: 100,
    category: 'protocol',
    timeLimit: 15
  },
  {
    id: 2,
    text: "Which port should be blocked to prevent unauthorized SSH access?",
    answers: ["22", "80", "443", "3389"],
    correct: 0,
    points: 100,
    category: 'firewall',
    timeLimit: 15
  },
  {
    id: 3,
    text: "Software that encrypts your files and demands payment is known as:",
    answers: [
      "Spyware",
      "Ransomware",
      "Adware",
      "Worms"
    ],
    correct: 1,
    points: 100,
    category: 'malware',
    timeLimit: 15
  },
  // Add more questions...
];

export default function NetworkDefenseGame({ roomId, room, playerId }: NetworkDefenseProps) {
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTIONS[0].timeLimit);
  const [submitted, setSubmitted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (submitted || gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          handleAnswer(-1); // Wrong answer if time runs out
          return QUESTIONS[currentQuestion].timeLimit;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [submitted, currentQuestion, gameOver]);

  const handleAnswer = (answerIndex: number) => {
    const question = QUESTIONS[currentQuestion];
    let correct = answerIndex === question.correct;
    let points = 0;

    if (correct) {
      points = question.points + (timeLeft * 10); // Time bonus
      setStreak(prev => prev + 1);
      if (streak >= 2) points *= 1.5; // Streak bonus
      setScore(prev => prev + points);
    } else {
      setLives(prev => prev - 1);
      setStreak(0);
      if (lives <= 1) {
        setGameOver(true);
        submitScore();
        return;
      }
    }

    if (currentQuestion >= QUESTIONS.length - 1) {
      setGameOver(true);
      submitScore();
    } else {
      setCurrentQuestion(prev => prev + 1);
      setTimeLeft(QUESTIONS[currentQuestion + 1].timeLimit);
    }
  };

  const submitScore = async () => {
    if (submitted) return;

    try {
      const roomRef = doc(db, 'rooms', roomId);
      const roomSnap = await getDoc(roomRef);
      const roomData = roomSnap.data() as Room;

      const submittedPlayers = roomData.players.filter(p => p.score);
      const place = submittedPlayers.length + 1;
      
      const lifeBonus = lives * 200;
      const finalScore = score + lifeBonus;

      const gameScore: GameScore = {
        timeLeft,
        complexity: score,
        total: finalScore,
        place,
        completedAt: new Date()
      };

      const updatedPlayers = roomData.players.map(p => 
        p.id === playerId 
          ? { 
              ...p, 
              score: gameScore, 
              hasSubmitted: true,
              stats: {
                totalGames: (p.stats?.totalGames || 0) + 1,
                wins: place === 1 ? (p.stats?.wins || 0) + 1 : (p.stats?.wins || 0),
                totalScore: (p.stats?.totalScore || 0) + finalScore,
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
            gameType: 'network',
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
      console.error('Failed to submit score:', error);
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
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-blue-400 flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Network Security Quiz
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  {[...Array(lives)].map((_, i) => (
                    <Heart 
                      key={i} 
                      className="h-5 w-5 text-red-500 ml-1" 
                      fill="currentColor"
                    />
                  ))}
                </div>
                <div>Time: {timeLeft}s</div>
                <div>Score: {score}</div>
                {streak >= 2 && (
                  <div className="text-yellow-400">
                    {streak}x Streak!
                  </div>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8 p-4">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 p-6 rounded-lg"
              >
                <div className="text-xl font-semibold mb-6">
                  {QUESTIONS[currentQuestion].text}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {QUESTIONS[currentQuestion].answers.map((answer, index) => (
                    <Button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      className="p-4 text-lg h-auto"
                      variant="outline"
                    >
                      {answer}
                    </Button>
                  ))}
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </div>

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
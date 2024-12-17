// app/components/NetworkDefenseGame.tsx
'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Trophy, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
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
  {
    id: 4,
    text: "What is the purpose of a honeypot in network security?",
    answers: [
      "To store encrypted data",
      "To attract and detect attackers",
      "To manage network traffic",
      "To backup system files"
    ],
    correct: 1,
    points: 100,
    category: 'protocol',
    timeLimit: 15
  },
  {
    id: 5,
    text: "Which of these is a type of Man-in-the-Middle attack?",
    answers: [
      "ARP Spoofing",
      "Buffer Overflow",
      "SQL Injection",
      "Zero-day Exploit"
    ],
    correct: 0,
    points: 100,
    category: 'protocol',
    timeLimit: 15
  },
  {
    id: 6,
    text: "What does NAT stand for in networking?",
    answers: [
      "Network Address Translation",
      "Network Authentication Token",
      "Native Access Transfer",
      "Network Authorization Type"
    ],
    correct: 0,
    points: 100,
    category: 'protocol',
    timeLimit: 15
  },
  {
    id: 7,
    text: "Which protocol is used for secure email transmission?",
    answers: [
      "HTTP",
      "FTP",
      "SMTP",
      "SMTPS"
    ],
    correct: 3,
    points: 100,
    category: 'protocol',
    timeLimit: 15
  },
  {
    id: 8,
    text: "What is the main purpose of an IDS (Intrusion Detection System)?",
    answers: [
      "Block network traffic",
      "Monitor for suspicious activity",
      "Encrypt data",
      "Manage passwords"
    ],
    correct: 1,
    points: 100,
    category: 'firewall',
    timeLimit: 15
  },
  {
    id: 9,
    text: "Which of these is NOT a type of firewall?",
    answers: [
      "Packet filtering",
      "Circuit-level gateway",
      "Memory scanning",
      "Application-level gateway"
    ],
    correct: 2,
    points: 100,
    category: 'firewall',
    timeLimit: 15
  },
  {
    id: 10,
    text: "What type of attack attempts to exhaust system resources?",
    answers: [
      "Phishing",
      "DDoS",
      "SQL Injection",
      "Cross-site Scripting"
    ],
    correct: 1,
    points: 100,
    category: 'protocol',
    timeLimit: 15
  }
];

export default function NetworkDefenseGame({ roomId, room, playerId }: NetworkDefenseProps) {
  const [score, setScore] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTIONS[0]?.timeLimit ?? 15);
  const [submitted, setSubmitted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = QUESTIONS[currentQuestionIndex];

  useEffect(() => {
    if (submitted || gameOver || !currentQuestion) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          handleAnswer(-1);
          return currentQuestion.timeLimit;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [submitted, currentQuestionIndex, gameOver, currentQuestion]);

  const handleAnswer = (answerIndex: number) => {
    try {
      if (!currentQuestion) return;

      let correct = answerIndex === currentQuestion.correct;
      if (correct) {
        const points = currentQuestion.points + (timeLeft * 10);
        setStreak(prev => prev + 1);
        setScore(prev => prev + (streak >= 2 ? points * 1.5 : points));
      } else {
        setStreak(0);
      }

      if (currentQuestionIndex >= QUESTIONS.length - 1) {
        setGameOver(true);
        submitScore();
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
        setTimeLeft(QUESTIONS[currentQuestionIndex + 1]?.timeLimit ?? 15);
      }
    } catch (err) {
      console.error('Error handling answer:', err);
      setError('An error occurred. Please try again.');
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
      
      const finalScore = score;
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
      setError('Failed to submit score. Please try again.');
    }
  };

  if (error) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-red-400 flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
            Restart Game
          </Button>
        </CardContent>
      </Card>
    );
  }

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
                <div>Question: {currentQuestionIndex + 1}/{QUESTIONS.length}</div>
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
                key={currentQuestionIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 p-6 rounded-lg"
              >
                <div className="text-xl font-semibold mb-6">
                  {currentQuestion?.text}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {currentQuestion?.answers.map((answer, index) => (
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
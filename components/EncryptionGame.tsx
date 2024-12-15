import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Clock, Trophy, Key, AlertCircle } from 'lucide-react';
import type { Room, GameScore } from '@/app/lib/types';

interface EncryptionGameProps {
  roomId: string;
  room: Room;
  playerId: string | null;
}

interface Challenge {
  message: string;
  key: string;
  correctAnswer: string;
  hint: string;
}

const challenges: Challenge[] = [
  {
    message: "HELLO WORLD",
    key: "3",
    correctAnswer: "KHOOR ZRUOG",
    hint: "Caesar cipher - shift each letter forward by the key number"
  },
  {
    message: "CYBERSECURITY",
    key: "KEY",
    correctAnswer: "MYFCPQIAFVXC",
    hint: "Vigenère cipher - repeat the key across the message and add letter positions"
  }
];

export default function EncryptionGame({ roomId, room, playerId }: EncryptionGameProps) {
  const [timeLeft, setTimeLeft] = useState(300);
  const [submitted, setSubmitted] = useState(false);
  const [answer, setAnswer] = useState('');
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [error, setError] = useState('');
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
    return userAnswer === challenge.correctAnswer ? 100 : 0;
  };

  const submitAnswer = async () => {
    if (!playerId) return;
    
    const accuracy = checkAnswer();
    
    if (accuracy === 0) {
      setError('Incorrect. Try again!');
      setAttempts(prev => prev + 1);
      return;
    }

    const score: GameScore = {
      timeLeft,
      complexity: Math.max(0, 100 - (attempts * 10)), // Reduce score based on attempts
      total: timeLeft + Math.max(0, 100 - (attempts * 10))
    };

    const updatedPlayers = room.players.map(p => 
      p.id === playerId 
        ? { ...p, score, hasSubmitted: true }
        : p
    );

    const allSubmitted = updatedPlayers.every(p => p.hasSubmitted);

    await updateDoc(doc(db, 'rooms', roomId), {
      players: updatedPlayers,
      allSubmitted,
      'gameState.status': allSubmitted ? 'roundEnd' : 'playing'
    });

    setSubmitted(true);
  };

  const challenge = challenges[currentChallenge];

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
            {room.players.map(player => (
              <div 
                key={player.id} 
                className={`p-4 rounded-lg flex items-center justify-between ${
                  player.id === playerId ? 'bg-blue-900' : 'bg-gray-700'
                }`}
              >
                <span>{player.name}</span>
                {player.hasSubmitted ? 
                  <Trophy className="h-5 w-5 text-green-500" /> : 
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
          <CardTitle className="text-xl font-semibold text-blue-400 flex items-center">
            <Lock className="mr-2 h-5 w-5" />
            Encryption Challenge - Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Message to Encrypt:</h3>
            <p className="text-2xl font-mono mb-4">{challenge.message}</p>
            <div className="flex items-center space-x-2 mb-4">
              <Key className="h-5 w-5 text-yellow-500" />
              <span className="font-mono">Key: {challenge.key}</span>
            </div>
            <p className="text-sm text-gray-300">{challenge.hint}</p>
          </div>

          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Enter encrypted message"
              value={answer}
              onChange={(e) => {
                setError('');
                setAnswer(e.target.value);
              }}
              className="bg-gray-700 border-gray-600 text-gray-100 font-mono"
            />
            {error && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            )}
            <Button
              onClick={submitAnswer}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Submit Answer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-yellow-400 flex items-center">
            <Key className="mr-2 h-5 w-5" />
            Encryption Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Caesar Cipher</h3>
              <p className="text-sm text-gray-300">
                Shift each letter forward in the alphabet by the key number.
                Example: With key 3, A→D, B→E, C→F...
              </p>
              <div className="mt-2 p-2 bg-gray-700 rounded font-mono text-xs">
                A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Vigenère Cipher</h3>
              <p className="text-sm text-gray-300">
                Use each letter in the key as a shift value (A=0, B=1, etc).
                Repeat the key to match message length.
                Example: KEY = shifts of 10,4,24
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
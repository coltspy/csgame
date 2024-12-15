// app/room/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Play, User, Trophy, Crown } from 'lucide-react';
import type { Room, Player, GameScore, GameType } from '@/app/lib/types';
import PasswordGame from '@/components/PasswordGame';
import GameMenu from '@/components/GameMenu';
import EncryptionGame from '@/components/EncryptionGame';
import NetworkDefenseGame from '@/components/NetworkDefenseGame';

export default function RoomPage() {
  const params = useParams();
  const id = params.id as string;
  const [room, setRoom] = useState<Room | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [password, setPassword] = useState('');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    const storedPlayerId = localStorage.getItem(`player_${id}`);
    if (storedPlayerId) {
      setPlayerId(storedPlayerId);
      setIsAuthenticated(true);
    }

    const unsubscribe = onSnapshot(doc(db, 'rooms', id), (doc) => {
      if (doc.exists()) {
        const roomData = doc.data() as Room;
        setRoom(roomData);
        // Check if current player is creator
        if (storedPlayerId === roomData.creatorId) {
          setIsCreator(true);
        }
      }
    });

    return () => unsubscribe();
  }, [id]);

  const joinGame = async () => {
    if (password === room?.password) {
      const newPlayerId = Math.random().toString(36).substr(2, 9);
      const newPlayer: Player = {
        id: newPlayerId,
        name: playerName,
        joinedAt: new Date(),
        score: null,
        hasSubmitted: false,
        totalScore: 0
      };

      const roomRef = doc(db, 'rooms', id);
      if (!room.players || room.players.length === 0) {
        await updateDoc(roomRef, {
          creatorId: newPlayerId,
          players: [newPlayer]
        });
        setIsCreator(true);
      } else {
        await updateDoc(roomRef, {
          players: [...room.players, newPlayer]
        });
      }

      setPlayerId(newPlayerId);
      localStorage.setItem(`player_${id}`, newPlayerId);
      setIsAuthenticated(true);
    } else {
      alert('Incorrect password');
    }
  };

  const startGame = async (gameType: GameType) => {
    if (!isCreator || !room) return;
    
    const roomRef = doc(db, 'rooms', id);
    const resetPlayers = room.players.map(p => ({
      ...p,
      score: null,
      hasSubmitted: false
    }));

    await updateDoc(roomRef, {
      'gameState.round': 1,
      'gameState.status': 'playing',
      'gameState.gameType': gameType,
      'gameState.currentQuestion': 0,
      'gameState.startTime': new Date(),
      allSubmitted: false,
      players: resetPlayers
    });
  };

  const resetToLobby = async () => {
    if (!isCreator || !room) return;
    
    const roomRef = doc(db, 'rooms', id);
    const updatedPlayers = room.players.map(p => ({
      ...p,
      totalScore: (p.totalScore || 0) + (p.score?.total || 0),
      score: null,
      hasSubmitted: false
    }));

    await updateDoc(roomRef, {
      'gameState.round': 0,
      'gameState.status': 'waiting',
      'gameState.gameType': null,
      allSubmitted: false,
      players: updatedPlayers
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      {!isAuthenticated ? (
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-blue-400">
                Join {room?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Your Name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
                />
                <Input
                  type="password"
                  placeholder="Room Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
                />
                <Button
                  onClick={joinGame}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Join Game
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-bold text-blue-400">
                Room: {room?.name}
              </CardTitle>
            </CardHeader>
          </Card>

          {room?.gameState?.status === 'waiting' && (
            <>
              <Card className="bg-gray-800 border-gray-700 mb-6">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-blue-400 flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Players
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {room?.players?.map((player) => (
                      <div 
                        key={player.id} 
                        className={`bg-gray-700 p-3 rounded-lg flex items-center justify-between ${
                          player.id === playerId ? 'border-2 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4 text-blue-400" />
                          <span>
                            {player.name} 
                            {player.id === playerId && ' (You)'}
                          </span>
                        </div>
                        {player.id === room.creatorId && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {isCreator && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-blue-400">
                      Select a Game
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GameMenu onSelectGame={startGame} />
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {room?.gameState?.status === 'playing' && 
          !room.allSubmitted && playerId && (
            <>
              {room.gameState.gameType === 'password' && (
                <PasswordGame 
                  roomId={id} 
                  room={room} 
                  playerId={playerId} 
                />
              )}
              {room.gameState.gameType === 'network' && (
                <NetworkDefenseGame
                  roomId={id}
                  room={room}
                  playerId={playerId}
                />
              )}
              {room.gameState.gameType === 'encryption' && (
                <EncryptionGame
                  roomId={id}
                  room={room}
                  playerId={playerId}
                />
              )}
            </>
          )}

          {room?.allSubmitted && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-green-400 flex items-center">
                  <Trophy className="mr-2 h-5 w-5" />
                  Game Complete - Final Scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...room.players]
                    .sort((a, b) => (b.score?.total || 0) - (a.score?.total || 0))
                    .map((player, index) => (
                      <div 
                        key={player.id}
                        className={`p-4 rounded-lg ${
                          index === 0 ? 'bg-yellow-900' :
                          index === 1 ? 'bg-gray-600' :
                          index === 2 ? 'bg-amber-900' :
                          'bg-gray-700'
                        } ${player.id === playerId ? 'border-2 border-blue-500' : ''}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold flex items-center">
                            {index + 1}. {player.name}
                            {player.id === room.creatorId && (
                              <Crown className="ml-2 h-4 w-4 text-yellow-500" />
                            )}
                          </span>
                          <span className="text-xl font-bold">
                            {player.score?.total || 0} pts
                          </span>
                        </div>
                        {player.score && (
                          <div className="text-sm text-gray-300 mt-2 flex justify-between">
                            <span>Speed: {player.score.timeLeft}s</span>
                            <span>Complexity: {player.score.complexity}</span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
                {isCreator && (
                  <div className="space-y-4 mt-6">
                    <Button 
                      onClick={resetToLobby}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Back to Game Selection
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
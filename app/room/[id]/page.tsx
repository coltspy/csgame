'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc, onSnapshot, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Play, Trophy, Crown, ChevronLeft, User } from 'lucide-react';
import type { Room, Player, GameType } from '@/app/lib/types';

// Import game components
import PasswordGame from '@/components/PasswordGame';
import GameMenu from '@/components/GameMenu';
import EncryptionGame from '@/components/EncryptionGame';
import NetworkDefenseGame from '@/components/NetworkDefenseGame';
import { Leaderboard } from '@/components/Leaderboard';

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [room, setRoom] = useState<Room | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [password, setPassword] = useState('');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedPlayerId = localStorage.getItem(`player_${id}`);
    if (storedPlayerId) {
      setPlayerId(storedPlayerId);
      setIsAuthenticated(true);
    }
  
    const roomRef = doc(db, 'rooms', id);
    
    const unsubscribe = onSnapshot(roomRef, 
      (doc) => {
        if (doc.exists()) {
          const roomData = doc.data() as Room;
          console.log('Room data updated:', roomData); // Debug log
          setRoom(roomData);
          
          if (storedPlayerId === roomData.creatorId) {
            setIsCreator(true);
          }
          
          if (storedPlayerId && !roomData.players.find(p => p.id === storedPlayerId)) {
            console.log('Player not found in room, redirecting to lobby');
            router.push('/lobby');
          }
        } else {
          console.log('Room not found, redirecting to lobby');
          router.push('/lobby');
        }
      },
      (error) => {
        console.error('Error fetching room:', error);
        setError('Failed to load room data');
      }
    );
  
    return () => unsubscribe();
  }, [id, router]);

  const handleJoinGame = async () => {
    if (!room) return;
    
    try {
      if (password !== room.password) {
        setError('Incorrect password');
        return;
      }

      if (room.players.length >= 8) {
        setError('Room is full');
        return;
      }

      const newPlayerId = Math.random().toString(36).substr(2, 9);
      const newPlayer = {
        id: newPlayerId,
        name: playerName,
        joinedAt: new Date(),
        score: null,
        hasSubmitted: false,
        stats: {
          totalGames: 0,
          wins: 0,
          totalScore: 0,
          bestTime: 0,
          averagePlace: 0
        }
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
    } catch (err) {
      setError('Failed to join room');
    }
  };

  const handleStartGame = async (gameType: GameType) => {
    if (!isCreator || !room) {
      console.error('Not authorized or room not found');
      return;
    }
    
    if (room.players.length < 2) {
      setError('Need at least 2 players to start');
      return;
    }
    
    try {
      const roomRef = doc(db, 'rooms', id);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        console.error('Room not found');
        router.push('/lobby');
        return;
      }
  
      const resetPlayers = room.players.map(p => ({
        ...p,
        score: null,
        hasSubmitted: false
      }));
  
      // Update with all required fields
      await updateDoc(roomRef, {
        'gameState.round': 1,
        'gameState.status': 'playing',
        'gameState.type': gameType,
        'gameState.startTime': new Date(),
        allSubmitted: false,
        players: resetPlayers
      });
  
      // Verify the update was successful
      const updatedSnap = await getDoc(roomRef);
      const updatedRoom = updatedSnap.data();
      
      if (!updatedRoom || updatedRoom.gameState.status !== 'playing') {
        throw new Error('Failed to update game state');
      }
  
    } catch (err) {
      console.error('Failed to start game:', err);
      setError('Failed to start game. Please try again.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-400">Join {room?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Your Name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="bg-blue-900/20 border-blue-500/30 text-gray-100"
              />
              <Input
                type="password"
                placeholder="Room Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-blue-900/20 border-blue-500/30 text-gray-100"
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button
                onClick={handleJoinGame}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Join Game
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!room) return null;

  const sortedPlayers = [...room.players]
    .sort((a, b) => (b.stats?.totalScore || 0) - (a.stats?.totalScore || 0));

  return (
    <div className="min-h-screen bg-[#000308] text-gray-100 relative">
      <div className="max-w-4xl mx-auto pt-24 px-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push('/lobby')}
          className="absolute top-8 left-8 text-blue-400 hover:text-blue-300 flex items-center"
        >
          <ChevronLeft className="mr-2" />
          Leave Room
        </motion.button>

        {room.gameState.status === 'waiting' ? (
  <div className="space-y-6">
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-blue-400 flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Players ({room.players.length}/8)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {sortedPlayers.map((player) => (
            <div
              key={player.id}
              className={`p-4 rounded-lg ${
                player.id === playerId 
                  ? 'bg-blue-600/20 border-2 border-blue-500'
                  : 'bg-blue-900/20 border border-blue-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-blue-400 mr-2" />
                  <span className="font-medium">
                    {player.name}
                    {player.id === playerId && (
                      <span className="ml-2 text-sm text-blue-400">(You)</span>
                    )}
                  </span>
                </div>
                {player.id === room.creatorId && (
                  <Crown className="h-4 w-4 text-yellow-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-blue-400 flex items-center">
          <Trophy className="mr-2 h-5 w-5" />
          Overall Rankings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {room.players.some(p => p.stats?.totalGames > 0) ? (
          <Leaderboard 
            players={room.players}
            isInGame={false}
            showStats={true}
          />
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No games played yet.</p>
            <p className="text-sm mt-2">Start a game to begin building the leaderboard!</p>
          </div>
        )}
      </CardContent>
    </Card>

            {isCreator && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-blue-400">
                    Select Game
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GameMenu onSelectGame={handleStartGame} />
                  {room.players.length < 2 && (
                    <p className="text-yellow-400 mt-4 text-sm">
                      Wait for more players to join before starting
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <>
            {room.gameState.type === 'password' && (
              <PasswordGame roomId={id} room={room} playerId={playerId || ''} />
            )}
            {room.gameState.type === 'network' && (
              <NetworkDefenseGame roomId={id} room={room} playerId={playerId || ''} />
            )}
            {room.gameState.type === 'encryption' && (
              <EncryptionGame roomId={id} room={room} playerId={playerId || ''} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
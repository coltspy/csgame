'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus, LogIn } from 'lucide-react';
import { motion } from "framer-motion";

interface Player {
  id: string;
  name: string;
  joinedAt: Date;
}

interface Room {
  id?: string;
  name: string;
  password: string;
  players: Player[];
  gameState?: {
    round: number;
    status: 'waiting' | 'playing';
  };
  createdAt?: Date;
}

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoom, setNewRoom] = useState({ name: '', password: '' });

  useEffect(() => {
    const roomsRef = collection(db, 'rooms');
    const unsubscribe = onSnapshot(roomsRef, (snapshot) => {
      setRooms(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Room)));
    });

    return () => unsubscribe();
  }, []);

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const creatorId = Math.random().toString(36).substr(2, 9);
    await addDoc(collection(db, 'rooms'), {
      name: newRoom.name,
      password: newRoom.password,
      players: [],
      creatorId,  // Add this
      gameState: {
        round: 0,
        status: 'waiting'
      },
      createdAt: new Date()
    });
    // Store creator ID
    localStorage.setItem(`creator_${creatorId}`, 'true');
    setNewRoom({ name: '', password: '' });
  };
  
  return (
    <main className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <motion.h1 
          className="text-4xl font-bold text-blue-400 mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Game Lobby
        </motion.h1>
        
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-400 flex items-center">
              <Plus className="mr-2 h-5 w-5" />
              Create New Room
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createRoom} className="space-y-4">
              <Input
                type="text"
                placeholder="Room Name"
                value={newRoom.name}
                onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
                required
              />
              <Input
                type="password"
                placeholder="Room Password"
                value={newRoom.password}
                onChange={(e) => setNewRoom({...newRoom, password: e.target.value})}
                className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
                required
              />
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create Room
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {rooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-blue-400">{room.name}</h2>
                    <Link href={`/room/${room.id}`}>
                      <Button className="bg-green-600 hover:bg-green-700 text-white">
                        <LogIn className="mr-2 h-4 w-4" />
                        Join Game
                      </Button>
                    </Link>
                  </div>
                  <p className="text-gray-400 flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    Players: {room.players?.length || 0}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}
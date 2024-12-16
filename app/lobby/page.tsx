'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Users, Plus, LogIn, ChevronLeft } from 'lucide-react';

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

interface Player {
  id: string;
  name: string;
  joinedAt: Date;
}

export default function Lobby() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoom, setNewRoom] = useState({ name: '', password: '' });
  const [isCreating, setIsCreating] = useState(false);

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
      creatorId,
      gameState: {
        round: 0,
        status: 'waiting'
      },
      createdAt: new Date()
    });
    localStorage.setItem(`creator_${creatorId}`, 'true');
    setNewRoom({ name: '', password: '' });
    setIsCreating(false);
  };

  return (
    <main className="min-h-screen bg-[#000308] text-gray-100 relative overflow-hidden">
      {/* Star field background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white rounded-full w-1 h-1"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.push('/')}
        className="absolute top-8 left-8 text-blue-400 hover:text-blue-300 flex items-center"
      >
        <ChevronLeft className="mr-2" />
        Back to Menu
      </motion.button>

      <div className="max-w-4xl mx-auto pt-24 px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <h1 className="text-4xl font-bold text-blue-400">Game Lobby</h1>
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create Room
          </Button>
        </motion.div>

        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 border border-blue-500/30 bg-blue-900/10 backdrop-blur-sm p-6 rounded-lg"
          >
            <h2 className="text-xl font-semibold text-blue-300 mb-4">Create New Room</h2>
            <form onSubmit={createRoom} className="space-y-4">
              <Input
                type="text"
                placeholder="Room Name"
                value={newRoom.name}
                onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                className="bg-blue-900/20 border-blue-500/30 text-gray-100 placeholder-gray-400"
                required
              />
              <Input
                type="password"
                placeholder="Room Password"
                value={newRoom.password}
                onChange={(e) => setNewRoom({...newRoom, password: e.target.value})}
                className="bg-blue-900/20 border-blue-500/30 text-gray-100 placeholder-gray-400"
                required
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Create Room
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  variant="outline"
                  className="border-blue-500/30 text-blue-400 hover:bg-blue-900/20"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {rooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-blue-500/30 bg-blue-900/10 backdrop-blur-sm p-6 rounded-lg"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-blue-400">{room.name}</h2>
                <Button
                  onClick={() => router.push(`/room/${room.id}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Join Game
                </Button>
              </div>
              <div className="flex items-center text-gray-400">
                <Users className="mr-2 h-4 w-4" />
                Players: {room.players?.length || 0}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}
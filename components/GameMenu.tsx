// app/components/GameMenu.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Mail, Lock } from 'lucide-react';
import type { GameType } from '@/app/lib/types';

interface GameMenuProps {
  onSelectGame: (gameType: GameType) => void;
}

export default function GameMenu({ onSelectGame }: GameMenuProps) {
  const games = [
    {
      type: 'password' as GameType,
      title: 'Password Challenge',
      description: 'Create secure passwords meeting requirements',
      icon: Shield
    },
    {
      type: 'network' as GameType,
      title: 'Network Defense',
      description: 'Configure firewall rules to protect systems',
      icon: Shield
    },
    {
      type: 'encryption' as GameType,
      title: 'Encryption Basics',
      description: 'Learn about basic encryption concepts',
      icon: Lock
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {games.map((game) => {
        const Icon = game.icon;
        return (
          <Card 
            key={game.type}
            className="bg-gray-700 border-gray-600 hover:bg-gray-600 cursor-pointer transition-all"
            onClick={() => onSelectGame(game.type)}
          >
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-blue-400 flex items-center">
                <Icon className="mr-2 h-5 w-5" />
                {game.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-300">{game.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
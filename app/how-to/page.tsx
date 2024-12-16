'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from "framer-motion";
import { ChevronLeft, Shield, Lock, Radio, Brain, Terminal } from 'lucide-react';
import React from 'react';

export default function HowToPlay() {
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<number>(0);

  const games = [
    {
      icon: Lock,
      title: "Password Challenge",
      description: "Create secure passwords that meet security requirements. Learn about password complexity and best practices.",
      tips: [
        "Use a mix of characters",
        "Avoid common patterns",
        "Think length over complexity"
      ]
    },
    {
      icon: Radio,
      title: "Network Defense",
      description: "Configure firewall rules to protect systems from various network threats and attacks.",
      tips: [
        "Analyze traffic patterns",
        "Block suspicious ports",
        "Monitor connection attempts"
      ]
    },
    {
      icon: Terminal,
      title: "Encryption Basics",
      description: "Learn and apply basic encryption techniques to secure sensitive messages.",
      tips: [
        "Understand cipher types",
        "Follow the key carefully",
        "Check your work twice"
      ]
    }
  ];

  return (
    <main className="min-h-screen bg-[#000308] text-gray-100 relative overflow-hidden flex flex-col items-center">
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

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full mx-auto pt-24 px-8 relative z-10"
      >
        <h1 className="text-4xl font-bold text-blue-400 mb-8">How to Play</h1>
        
        {/* Game selection */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {games.map((game, index) => {
            const Icon = game.icon;
            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedGame(index)}
                className={`
                  p-4 cursor-pointer
                  border border-blue-500/30
                  ${selectedGame === index 
                    ? 'bg-blue-600/20 border-blue-400'
                    : 'bg-blue-900/10 hover:bg-blue-600/10'}
                  backdrop-blur-sm
                  transition-all duration-200
                `}
              >
                <Icon className="w-8 h-8 mb-2 text-blue-400" />
                <h3 className="text-lg font-semibold text-blue-300">{game.title}</h3>
              </motion.div>
            );
          })}
        </div>

        {/* Selected game details */}
        <motion.div
          key={selectedGame}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-blue-500/30 bg-blue-900/10 backdrop-blur-sm p-8"
        >
          <div className="flex items-center mb-4">
            {React.createElement(games[selectedGame].icon, { className: "w-6 h-6 mr-3 text-blue-400" })}
            <h2 className="text-2xl font-semibold text-blue-300">{games[selectedGame].title}</h2>
          </div>
          
          <p className="text-gray-300 mb-6">{games[selectedGame].description}</p>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-400">Pro Tips:</h3>
            {games[selectedGame].tips.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center"
              >
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3" />
                <p className="text-gray-300">{tip}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}
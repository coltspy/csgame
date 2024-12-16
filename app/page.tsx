'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from "framer-motion";
import { Play, Info, Settings } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const menuOptions = [
    { icon: Play, text: "PLAY", action: () => router.push('/lobby') },
    { icon: Info, text: "HOW TO PLAY", action: () => router.push('/how-to') },
    { icon: Settings, text: "SETTINGS", action: () => router.push('/settings') }
  ];

  return (
    <main className="min-h-screen bg-[#000308] text-gray-100 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Star field effect */}
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

      {/* Title */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
        className="mb-16"
      >
        <h1 className="text-7xl font-bold bg-gradient-to-b from-blue-300 to-blue-600 bg-clip-text text-transparent">
          CYBERGUARD
        </h1>
      </motion.div>

      {/* Menu Options */}
      <div className="space-y-4 relative z-10">
        {menuOptions.map((option, index) => {
          const Icon = option.icon;
          return (
            <motion.div
              key={index}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              onClick={option.action}
              onMouseEnter={() => setSelectedOption(index)}
              onMouseLeave={() => setSelectedOption(null)}
              className={`
                w-96 h-16 cursor-pointer
                flex items-center px-6
                border border-blue-500/30
                ${selectedOption === index 
                  ? 'bg-blue-600/20 border-blue-400'
                  : 'bg-blue-900/10 hover:bg-blue-600/10'}
                backdrop-blur-sm
                transition-all duration-200
              `}
            >
              <Icon 
                className={`mr-4 ${
                  selectedOption === index 
                    ? 'text-blue-300 animate-pulse'
                    : 'text-blue-500'
                }`}
              />
              <span className={`text-xl font-semibold ${
                selectedOption === index 
                  ? 'text-blue-300'
                  : 'text-blue-500'
              }`}>
                {option.text}
              </span>
              {selectedOption === index && (
                <motion.div
                  className="absolute inset-0 border-2 border-blue-400/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  layoutId="menu-selection"
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Version number */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-4 right-4 text-blue-500/60 text-sm"
      >
        v1.0.0
      </motion.div>
    </main>
  );
}
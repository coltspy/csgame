'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from "framer-motion";
import { ChevronLeft, Volume2, Monitor, Clock, Globe, Moon } from 'lucide-react';

interface SettingsState {
  volume: number;
  musicVolume: number;
  difficulty: 'easy' | 'normal' | 'hard';
  theme: 'light' | 'dark';
  language: 'english' | 'spanish' | 'french';
  timeLimit: boolean;
}

type SettingKey = keyof SettingsState;

export default function Settings() {
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsState>({
    volume: 80,
    musicVolume: 60,
    difficulty: 'normal',
    theme: 'dark',
    language: 'english',
    timeLimit: true
  });

  const handleSliderChange = (setting: 'volume' | 'musicVolume', value: number) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSelectChange = (setting: 'difficulty' | 'language', value: string) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleToggle = (setting: 'timeLimit' | 'theme') => {
    setSettings(prev => ({
      ...prev,
      [setting]: typeof prev[setting] === 'boolean' ? !prev[setting] : prev[setting]
    }));
  };

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
        className="max-w-2xl w-full mx-auto pt-24 px-8 relative z-10"
      >
        <h1 className="text-4xl font-bold text-blue-400 mb-8">Settings</h1>

        <div className="space-y-6">
          {/* Audio Settings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="border border-blue-500/30 bg-blue-900/10 backdrop-blur-sm p-6"
          >
            <h2 className="text-xl font-semibold text-blue-300 mb-4">Audio</h2>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center text-gray-300 mb-2">
                  <Volume2 className="w-5 h-5 mr-2" />
                  Sound Effects Volume
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.volume}
                  onChange={(e) => handleSliderChange('volume', parseInt(e.target.value))}
                  className="w-full h-2 bg-blue-900 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm text-blue-400">{settings.volume}%</span>
              </div>

              <div>
                <label className="flex items-center text-gray-300 mb-2">
                  <Moon className="w-5 h-5 mr-2" />
                  Music Volume
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.musicVolume}
                  onChange={(e) => handleSliderChange('musicVolume', parseInt(e.target.value))}
                  className="w-full h-2 bg-blue-900 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm text-blue-400">{settings.musicVolume}%</span>
              </div>
            </div>
          </motion.div>

          {/* Game Settings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="border border-blue-500/30 bg-blue-900/10 backdrop-blur-sm p-6"
          >
            <h2 className="text-xl font-semibold text-blue-300 mb-4">Game</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center text-gray-300">
                  <Clock className="w-5 h-5 mr-2" />
                  Time Limit
                </label>
                <button
                  onClick={() => handleToggle('timeLimit')}
                  className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                    settings.timeLimit ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 transform ${
                    settings.timeLimit ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div>
                <label className="flex items-center text-gray-300 mb-2">
                  <Globe className="w-5 h-5 mr-2" />
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => handleSelectChange('language', e.target.value as SettingsState['language'])}
                  className="w-full p-2 bg-blue-900/30 border border-blue-500/30 rounded text-gray-300"
                >
                  <option value="english">English</option>
                  <option value="spanish">Spanish</option>
                  <option value="french">French</option>
                </select>
              </div>

              <div>
                <label className="flex items-center text-gray-300 mb-2">
                  <Monitor className="w-5 h-5 mr-2" />
                  Difficulty
                </label>
                <select
                  value={settings.difficulty}
                  onChange={(e) => handleSelectChange('difficulty', e.target.value as SettingsState['difficulty'])}
                  className="w-full p-2 bg-blue-900/30 border border-blue-500/30 rounded text-gray-300"
                >
                  <option value="easy">Easy</option>
                  <option value="normal">Normal</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Save button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => {
            localStorage.setItem('gameSettings', JSON.stringify(settings));
            router.push('/');
          }}
          className="w-full mt-6 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors duration-200"
        >
          Save Changes
        </motion.button>
      </motion.div>
    </main>
  );
}
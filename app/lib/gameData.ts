// app/lib/gameData.ts

import { Round } from './types';

export const rounds: Round[] = [
  {
    number: 1,
    title: "Password Security Basics",
    description: "Test your knowledge of password security fundamentals",
    timeLimit: 300,
    questions: [
      {
        id: 1,
        text: "Which of these passwords is the strongest?",
        options: [
          "password123",
          "P@ssw0rd!",
          "correcthorsebatterystaple",
          "Tr0ub4dor&3"
        ],
        correctAnswers: ["correcthorsebatterystaple"],
        points: 10
      },
      {
        id: 2,
        text: "Select all good password practices:",
        options: [
          "Use different passwords for each account",
          "Write passwords on sticky notes",
          "Use a password manager",
          "Include personal information"
        ],
        correctAnswers: [
          "Use different passwords for each account",
          "Use a password manager"
        ],
        points: 15
      },
      {
        id: 3,
        text: "What makes a password vulnerable to cracking?",
        options: [
          "Using common dictionary words",
          "Short length (less than 8 characters)",
          "Sequential numbers (123456)",
          "All of the above"
        ],
        correctAnswers: ["All of the above"],
        points: 10
      }
    ]
  }
];
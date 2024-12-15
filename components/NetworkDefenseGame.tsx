import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Clock, Trophy, Network, AlertTriangle } from 'lucide-react';
import type { Room, GameScore } from '@/app/lib/types';

interface NetworkDefenseProps {
  roomId: string;
  room: Room;
  playerId: string | null;
}

interface TrafficLog {
  timestamp: string;
  source: string;
  destination: string;
  port: number;
  protocol: 'TCP' | 'UDP';
  payload: string;
  flags?: string[];
}

interface TrafficRule {
  id: number;
  port: number;
  protocol: 'TCP' | 'UDP';
  source: string;
  action: 'ALLOW' | 'DENY';
}

interface Scenario {
  id: number;
  title: string;
  description: string;
  trafficLogs: TrafficLog[];
  requiredRules: TrafficRule[];
  hints: string[];
  learningResources: {
    title: string;
    content: string[];
  }[];
}

const scenarios: Scenario[] = [
  {
    id: 1,
    title: "Web Server Under Attack",
    description: "You're managing a company web server that's experiencing unusual traffic patterns. Analyze the logs and create firewall rules to protect the server.",
    trafficLogs: [
      {
        timestamp: "2024-03-22 10:15:23",
        source: "203.0.113.42",
        destination: "10.0.0.5",
        port: 80,
        protocol: 'TCP',
        payload: "GET /index.html HTTP/1.1",
        flags: ["SYN"]
      },
      {
        timestamp: "2024-03-22 10:15:24",
        source: "192.168.1.100",
        destination: "10.0.0.5",
        port: 22,
        protocol: 'TCP',
        payload: "SSH-2.0-OpenSSH_8.2p1",
        flags: ["SYN", "RST"]
      },
      {
        timestamp: "2024-03-22 10:15:25",
        source: "198.51.100.77",
        destination: "10.0.0.5",
        port: 443,
        protocol: 'TCP',
        payload: "Client Hello",
        flags: ["SYN"]
      },
      {
        timestamp: "2024-03-22 10:15:26",
        source: "10.0.0.50",
        destination: "10.0.0.5",
        port: 3389,
        protocol: 'TCP',
        payload: "RDP Negotiation Request",
        flags: ["SYN", "RST", "ACK"]
      }
    ],
    requiredRules: [
      { id: 1, port: 80, protocol: 'TCP', source: '0.0.0.0/0', action: 'ALLOW' },
      { id: 2, port: 443, protocol: 'TCP', source: '0.0.0.0/0', action: 'ALLOW' },
      { id: 3, port: 22, protocol: 'TCP', source: '192.168.1.100', action: 'DENY' },
      { id: 4, port: 3389, protocol: 'TCP', source: '10.0.0.50', action: 'DENY' }
    ],
    hints: [
      "Look for repeated connection attempts with RST flags",
      "Check for unusual port access patterns",
      "Consider which services should be publicly accessible",
      "Analyze source IP addresses for internal vs external traffic"
    ],
    learningResources: [
      {
        title: "TCP Flags",
        content: [
          "SYN: Initiates connection",
          "RST: Indicates connection reset",
          "ACK: Acknowledges received data",
          "Multiple RSTs might indicate port scanning"
        ]
      },
      {
        title: "Common Ports",
        content: [
          "80: HTTP - Web traffic",
          "443: HTTPS - Secure web traffic",
          "22: SSH - Remote access",
          "3389: RDP - Remote desktop"
        ]
      }
    ]
  }
];

export default function NetworkDefenseGame({ roomId, room, playerId }: NetworkDefenseProps) {
  const [timeLeft, setTimeLeft] = useState(300);
  const [submitted, setSubmitted] = useState(false);
  const [userRules, setUserRules] = useState<TrafficRule[]>([]);
  const [error, setError] = useState('');
  const [currentScenario, setCurrentScenario] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);
  const [showLearningResource, setShowLearningResource] = useState(false);
  const [currentResource, setCurrentResource] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!submitted) {
        setTimeLeft(prev => {
          if (prev <= 0) {
            submitRules();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [submitted]);

  const checkRules = (): number => {
    const scenario = scenarios[currentScenario];
    let score = 0;
    
    scenario.requiredRules.forEach(required => {
      if (userRules.some(rule => 
        rule.port === required.port && 
        rule.protocol === required.protocol &&
        rule.source === required.source &&
        rule.action === required.action
      )) {
        score += 25; // 25 points per correct rule
      }
    });

    return score;
  };

  const submitRules = async () => {
    if (!playerId) return;
    
    const ruleScore = checkRules();
    
    if (ruleScore === 0) {
      setError('Incorrect configuration. Try again!');
      return;
    }

    const score: GameScore = {
      timeLeft,
      complexity: ruleScore,
      total: timeLeft + ruleScore
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

  const toggleRule = (rule: TrafficRule) => {
    setUserRules(prev => {
      const exists = prev.some(r => r.id === rule.id);
      if (exists) {
        return prev.filter(r => r.id !== rule.id);
      }
      return [...prev, rule];
    });
  };

  const showNextHint = () => {
    if (currentHint < scenario.hints.length - 1) {
      setCurrentHint(prev => prev + 1);
    }
    setShowHint(true);
  };

  const toggleLearningResource = () => {
    setShowLearningResource(!showLearningResource);
  };

  const scenario = scenarios[currentScenario];

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
            <Shield className="mr-2 h-5 w-5" />
            Network Defense - Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">{scenario.title}</h3>
            <p className="text-gray-300 mb-4">{scenario.description}</p>

            <div className="space-y-4">
              <h4 className="font-semibold text-blue-400">Traffic Logs:</h4>
              <div className="space-y-2 font-mono text-sm">
                {scenario.trafficLogs.map((log, index) => (
                  <div key={index} className="bg-gray-800 p-2 rounded">
                    <div className="text-gray-400">{log.timestamp}</div>
                    <div>
                      Source: {log.source} → {log.destination}:${log.port} ({log.protocol})
                    </div>
                    <div className="text-gray-400">Payload: {log.payload}</div>
                    {log.flags && (
                      <div className="text-yellow-400">
                        Flags: {log.flags.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <h3 className="font-semibold">Configure Firewall Rules:</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={showNextHint}
                className="text-yellow-400"
              >
                Need a hint?
              </Button>
            </div>

            {showHint && (
              <div className="bg-yellow-900/30 p-3 rounded border border-yellow-400/30">
                <p className="text-yellow-400 text-sm">{scenario.hints[currentHint]}</p>
              </div>
            )}

            <div className="space-y-2">
              {scenario.requiredRules.map(rule => (
                <div key={rule.id} className="flex items-center space-x-2 bg-gray-700 p-3 rounded">
                  <Checkbox
                    id={`rule-${rule.id}`}
                    checked={userRules.some(r => r.id === rule.id)}
                    onCheckedChange={() => toggleRule(rule)}
                  />
                  <label htmlFor={`rule-${rule.id}`} className="text-sm">
                    {rule.action} {rule.protocol} traffic on port {rule.port} from {rule.source}
                  </label>
                </div>
              ))}
            </div>

            {error && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                {error}
              </div>
            )}

            <Button
              onClick={submitRules}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Apply Rules
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-yellow-400 flex items-center">
            <Network className="mr-2 h-5 w-5" />
            Security Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scenario.learningResources.map((resource, index) => (
              <div key={index} className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full text-left flex justify-between items-center"
                  onClick={() => {
                    setCurrentResource(index);
                    toggleLearningResource();
                  }}
                >
                  {resource.title}
                  {showLearningResource && currentResource === index ? '−' : '+'}
                </Button>
                {showLearningResource && currentResource === index && (
                  <div className="bg-gray-700 p-3 rounded text-sm space-y-1">
                    {resource.content.map((item, i) => (
                      <p key={i} className="text-gray-300">{item}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
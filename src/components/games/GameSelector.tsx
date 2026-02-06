'use client';

import { useMemo } from 'react';
import type { GameType } from '@/lib/gameData';
import ShakeGame from './ShakeGame';
import ShakeStickGame from './ShakeStickGame';
import ScrambleGame from './ScrambleGame';
import QuizGame from './QuizGame';

interface GameSelectorProps {
  enabledGames: GameType[];
  customSentences?: string[];
  customQuestions?: { question: string; answer: string }[];
  onComplete: () => void;
}

export default function GameSelector({ enabledGames, customSentences, customQuestions, onComplete }: GameSelectorProps) {
  const selectedGame = useMemo(() => {
    const games = enabledGames.length > 0 ? enabledGames : ['shake'] as GameType[];
    return games[Math.floor(Math.random() * games.length)];
  }, [enabledGames]);

  switch (selectedGame) {
    case 'shake-stick':
      return <ShakeStickGame onComplete={onComplete} />;
    case 'scramble':
      return <ScrambleGame customSentences={customSentences} onComplete={onComplete} />;
    case 'quiz':
      return <QuizGame customQuestions={customQuestions} onComplete={onComplete} />;
    case 'shake':
    default:
      return <ShakeGame onComplete={onComplete} />;
  }
}

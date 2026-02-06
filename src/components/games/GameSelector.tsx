'use client';

import { useMemo } from 'react';
import type { GameType } from '@/lib/gameData';
import ShakeGame from './ShakeGame';
import ScrambleGame from './ScrambleGame';
import QuizGame from './QuizGame';

interface GameSelectorProps {
  enabledGames: GameType[];
  onComplete: () => void;
}

export default function GameSelector({ enabledGames, onComplete }: GameSelectorProps) {
  const selectedGame = useMemo(() => {
    const games = enabledGames.length > 0 ? enabledGames : ['shake'] as GameType[];
    return games[Math.floor(Math.random() * games.length)];
  }, [enabledGames]);

  switch (selectedGame) {
    case 'scramble':
      return <ScrambleGame onComplete={onComplete} />;
    case 'quiz':
      return <QuizGame onComplete={onComplete} />;
    case 'shake':
    default:
      return <ShakeGame onComplete={onComplete} />;
  }
}

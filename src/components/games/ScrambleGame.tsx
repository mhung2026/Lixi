'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SCRAMBLE_SENTENCES } from '@/lib/gameData';

interface ScrambleGameProps {
  customSentences?: string[];
  onComplete: () => void;
}

/** Fisher-Yates shuffle (returns a new array) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TIMER_SECONDS = 30;

export default function ScrambleGame({ customSentences, onComplete }: ScrambleGameProps) {
  // Pick a random sentence: use custom if provided, else default
  const sentence = useMemo(() => {
    const pool = customSentences && customSentences.length > 0 ? customSentences : SCRAMBLE_SENTENCES;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [customSentences]);

  const correctWords = useMemo(() => sentence.split(' '), [sentence]);

  const shuffledWords = useMemo(() => {
    let result = shuffle(correctWords);
    // Make sure the shuffled order is not already correct
    while (result.join(' ') === correctWords.join(' ') && correctWords.length > 1) {
      result = shuffle(correctWords);
    }
    return result;
  }, [correctWords]);

  // selectedIndices: indices into shuffledWords in the order the player tapped them
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [status, setStatus] = useState<'playing' | 'correct' | 'wrong'>('playing');
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const completedRef = useRef(false);

  // ---------- Timer ----------
  useEffect(() => {
    if (status !== 'playing') return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  // Auto-complete when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && !completedRef.current) {
      completedRef.current = true;
      setStatus('correct');
      setTimeout(() => onComplete(), 1500);
    }
  }, [timeLeft, onComplete]);

  // ---------- Check answer when all words selected ----------
  const checkAnswer = useCallback(
    (indices: number[]) => {
      if (indices.length !== shuffledWords.length) return;

      const playerSentence = indices.map((i) => shuffledWords[i]).join(' ');

      if (playerSentence === correctWords.join(' ')) {
        // Correct!
        if (!completedRef.current) {
          completedRef.current = true;
          setStatus('correct');
          setTimeout(() => onComplete(), 1500);
        }
      } else {
        // Wrong — shake then reset
        setStatus('wrong');
        setTimeout(() => {
          setSelectedIndices([]);
          setStatus('playing');
        }, 800);
      }
    },
    [shuffledWords, correctWords, onComplete],
  );

  // ---------- Tap handlers ----------
  const handleSelectWord = (index: number) => {
    if (status !== 'playing') return;
    if (selectedIndices.includes(index)) return;

    const next = [...selectedIndices, index];
    setSelectedIndices(next);

    // Check once all words are placed
    if (next.length === shuffledWords.length) {
      checkAnswer(next);
    }
  };

  const handleDeselectWord = (positionIndex: number) => {
    if (status !== 'playing') return;
    setSelectedIndices((prev) => prev.filter((_, i) => i !== positionIndex));
  };

  // ---------- Derived ----------
  const selectedWords = selectedIndices.map((i) => shuffledWords[i]);
  const isWordUsed = (index: number) => selectedIndices.includes(index);

  return (
    <div className="flex flex-col items-center gap-5 py-4 select-none">
      {/* Timer */}
      <div className="flex items-center gap-2">
        <div
          className={`text-sm font-bold px-3 py-1 rounded-full ${
            timeLeft <= 10
              ? 'bg-red-100 text-red-600 animate-pulse'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {timeLeft}s
        </div>
      </div>

      {/* Sentence area — where selected words appear */}
      <div
        className={`w-full min-h-[56px] flex flex-wrap items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed transition-all ${
          status === 'correct'
            ? 'border-green-400 bg-green-50'
            : status === 'wrong'
              ? 'border-red-400 bg-red-50 animate-[headshake_0.5s_ease-in-out]'
              : 'border-amber-300 bg-amber-50/50'
        }`}
      >
        {selectedWords.length === 0 && (
          <span className="text-amber-300 text-sm italic">Chạm từ bên dưới để xếp câu...</span>
        )}
        {selectedWords.map((word, i) => (
          <button
            key={`selected-${i}`}
            onClick={() => handleDeselectWord(i)}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-all active:scale-95 ${
              status === 'correct'
                ? 'bg-green-500 text-white shadow-md'
                : 'bg-amber-500 text-white shadow-md hover:bg-amber-400'
            }`}
          >
            {word}
          </button>
        ))}
      </div>

      {/* Status message */}
      {status === 'correct' && (
        <div className="text-lg font-extrabold text-green-600 bg-green-100 px-5 py-2 rounded-xl animate-bounce">
          {"CHÍNH XÁC! \uD83C\uDF89"}
        </div>
      )}

      {/* Word bank — shuffled words to pick from */}
      {status !== 'correct' && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {shuffledWords.map((word, i) => {
            const used = isWordUsed(i);
            return (
              <button
                key={`word-${i}`}
                onClick={() => handleSelectWord(i)}
                disabled={used || status !== 'playing'}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                  used
                    ? 'bg-amber-100 text-amber-300 cursor-default scale-90 opacity-50'
                    : 'bg-amber-400 text-amber-900 shadow-md hover:bg-amber-300 active:scale-95 hover:shadow-lg'
                }`}
              >
                {word}
              </button>
            );
          })}
        </div>
      )}

      {/* Encouragement when time ran out */}
      {timeLeft === 0 && status === 'correct' && (
        <p className="text-sm text-amber-600 font-medium">
          {"T\u1EBFt m\u00E0, ai c\u0169ng c\u00F3 ph\u1EA7n! \uD83E\uDDE7"}
        </p>
      )}

      {/* Inline keyframe for head-shake on wrong answer */}
      <style jsx>{`
        @keyframes headshake {
          0%   { transform: translateX(0); }
          15%  { transform: translateX(-8px) rotate(-1deg); }
          30%  { transform: translateX(6px) rotate(1deg); }
          45%  { transform: translateX(-4px) rotate(-0.5deg); }
          60%  { transform: translateX(3px) rotate(0.5deg); }
          75%  { transform: translateX(-1px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

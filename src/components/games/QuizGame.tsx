'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { QUIZ_QUESTIONS, getRandomItem } from '@/lib/gameData';
import type { QuizQuestion } from '@/lib/gameData';

interface QuizGameProps {
  onComplete: () => void;
}

const TIMER_SECONDS = 15;

export default function QuizGame({ onComplete }: QuizGameProps) {
  const [question] = useState<QuizQuestion>(() => getRandomItem(QUIZ_QUESTIONS));
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const completeCalled = useRef(false);

  // Stable callback so we don't re-trigger effects
  const handleComplete = useCallback(() => {
    if (completeCalled.current) return;
    completeCalled.current = true;
    setTimeout(() => onComplete(), 2000);
  }, [onComplete]);

  // Countdown timer
  useEffect(() => {
    if (selected !== null) return; // stop ticking once answered
    if (timeLeft <= 0) {
      // Time ran out — auto-pick nothing (treat as wrong)
      setSelected(-1);
      handleComplete();
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft, selected, handleComplete]);

  const handleSelect = (index: number) => {
    if (selected !== null) return; // already answered
    setSelected(index);
    handleComplete();
  };

  const isCorrect = selected === question.correct;
  const answered = selected !== null;

  // Determine button styles per option
  const getOptionClass = (index: number) => {
    const base =
      'w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-300 border-2';

    if (!answered) {
      return `${base} bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100 hover:border-amber-400 active:scale-[0.98]`;
    }

    // After answering
    if (index === question.correct) {
      return `${base} bg-green-100 border-green-500 text-green-800`;
    }
    if (index === selected && selected !== question.correct) {
      return `${base} bg-red-100 border-red-500 text-red-800`;
    }
    return `${base} bg-amber-50/50 border-amber-100 text-amber-400`;
  };

  // Timer bar width percentage
  const timerPercent = (timeLeft / TIMER_SECONDS) * 100;
  const timerColor =
    timeLeft > 10 ? 'bg-green-500' : timeLeft > 5 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Timer bar */}
      <div className="w-full bg-amber-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${timerColor}`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {/* Timer text */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-amber-700">
          {answered ? 'Đã trả lời!' : `Thời gian: ${timeLeft}s`}
        </span>
        <span className="text-xl">❓</span>
      </div>

      {/* Question */}
      <h2 className="text-lg font-bold text-amber-900 leading-snug text-center">
        {question.question}
      </h2>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            disabled={answered}
            onClick={() => handleSelect(index)}
            className={getOptionClass(index)}
          >
            <span className="mr-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-200/60 text-amber-700 text-xs font-bold shrink-0">
              {String.fromCharCode(65 + index)}
            </span>
            {option}
          </button>
        ))}
      </div>

      {/* Result message */}
      {answered && (
        <div
          className={`text-center font-bold text-base mt-2 animate-[fadeIn_0.3s_ease-out] ${
            selected === -1
              ? 'text-amber-600'
              : isCorrect
                ? 'text-green-600'
                : 'text-red-600'
          }`}
        >
          {selected === -1 ? (
            <p>
              Hết giờ! Đáp án đúng là:{' '}
              <span className="underline">{question.options[question.correct]}</span>
            </p>
          ) : isCorrect ? (
            <p>Đúng rồi! 🎉</p>
          ) : (
            <p>
              Sai rồi! Đáp án đúng là:{' '}
              <span className="underline">{question.options[question.correct]}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { QUIZ_QUESTIONS, getRandomItem } from '@/lib/gameData';
import type { QuizQuestion } from '@/lib/gameData';

interface CustomQuestion {
  question: string;
  answer: string;
}

interface QuizGameProps {
  customQuestions?: CustomQuestion[];
  onComplete: () => void;
}

/** Remove Vietnamese diacritics for comparison */
function removeDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim();
}

const TIMER_SECONDS = 15;

export default function QuizGame({ customQuestions, onComplete }: QuizGameProps) {
  const useCustom = customQuestions && customQuestions.length > 0;

  // Default mode: multiple choice
  const [mcQuestion] = useState<QuizQuestion>(() => getRandomItem(QUIZ_QUESTIONS));
  const [selected, setSelected] = useState<number | null>(null);

  // Custom mode: text input
  const [customQ] = useState<CustomQuestion | null>(() =>
    useCustom ? customQuestions[Math.floor(Math.random() * customQuestions.length)] : null
  );
  const [userAnswer, setUserAnswer] = useState('');
  const [customAnswered, setCustomAnswered] = useState(false);
  const [customCorrect, setCustomCorrect] = useState(false);

  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const completeCalled = useRef(false);

  const answered = useCustom ? customAnswered : selected !== null;

  const handleComplete = useCallback(() => {
    if (completeCalled.current) return;
    completeCalled.current = true;
    setTimeout(() => onComplete(), 2000);
  }, [onComplete]);

  // Countdown timer
  useEffect(() => {
    if (answered) return;
    if (timeLeft <= 0) {
      if (useCustom) {
        setCustomAnswered(true);
        setCustomCorrect(false);
      } else {
        setSelected(-1);
      }
      handleComplete();
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft, answered, handleComplete, useCustom]);

  // --- Default mode handlers ---
  const handleSelect = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
    handleComplete();
  };

  const isCorrectMC = selected === mcQuestion.correct;

  const getOptionClass = (index: number) => {
    const base = 'w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-300 border-2';
    if (selected === null) {
      return `${base} bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100 hover:border-amber-400 active:scale-[0.98]`;
    }
    if (index === mcQuestion.correct) {
      return `${base} bg-green-100 border-green-500 text-green-800`;
    }
    if (index === selected && selected !== mcQuestion.correct) {
      return `${base} bg-red-100 border-red-500 text-red-800`;
    }
    return `${base} bg-amber-50/50 border-amber-100 text-amber-400`;
  };

  // --- Custom mode handler ---
  const handleSubmitCustom = () => {
    if (customAnswered || !customQ) return;
    const correct = removeDiacritics(userAnswer) === removeDiacritics(customQ.answer);
    setCustomCorrect(correct);
    setCustomAnswered(true);
    handleComplete();
  };

  // Timer bar
  const timerPercent = (timeLeft / TIMER_SECONDS) * 100;
  const timerColor = timeLeft > 10 ? 'bg-green-500' : timeLeft > 5 ? 'bg-amber-500' : 'bg-red-500';

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

      {/* ===== CUSTOM MODE: Text input ===== */}
      {useCustom && customQ ? (
        <>
          <h2 className="text-lg font-bold text-amber-900 leading-snug text-center">
            {customQ.question}
          </h2>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập câu trả lời..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={customAnswered}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitCustom()}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-50 border-2 border-amber-200 text-amber-900 placeholder-amber-300 font-medium text-center focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
              autoFocus
            />
            {!customAnswered && (
              <button
                onClick={handleSubmitCustom}
                className="py-3 px-5 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-all active:scale-95"
              >
                Gửi
              </button>
            )}
          </div>

          <p className="text-amber-400 text-xs text-center">Không cần nhập dấu</p>

          {customAnswered && (
            <div className={`text-center font-bold text-base mt-2 ${customCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {timeLeft === 0 && !userAnswer.trim() ? (
                <p>Hết giờ! Đáp án: <span className="underline">{customQ.answer}</span></p>
              ) : customCorrect ? (
                <p>Đúng rồi! 🎉</p>
              ) : (
                <p>Sai rồi! Đáp án: <span className="underline">{customQ.answer}</span></p>
              )}
            </div>
          )}
        </>
      ) : (
        /* ===== DEFAULT MODE: Multiple choice ===== */
        <>
          <h2 className="text-lg font-bold text-amber-900 leading-snug text-center">
            {mcQuestion.question}
          </h2>

          <div className="flex flex-col gap-3">
            {mcQuestion.options.map((option, index) => (
              <button
                key={index}
                disabled={selected !== null}
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

          {selected !== null && (
            <div
              className={`text-center font-bold text-base mt-2 ${
                selected === -1 ? 'text-amber-600' : isCorrectMC ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {selected === -1 ? (
                <p>Hết giờ! Đáp án đúng là: <span className="underline">{mcQuestion.options[mcQuestion.correct]}</span></p>
              ) : isCorrectMC ? (
                <p>Đúng rồi! 🎉</p>
              ) : (
                <p>Sai rồi! Đáp án đúng là: <span className="underline">{mcQuestion.options[mcQuestion.correct]}</span></p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

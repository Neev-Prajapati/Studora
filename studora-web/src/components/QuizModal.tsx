"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, XCircle, BrainCircuit, RefreshCw } from "lucide-react";

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
};

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: QuizQuestion[];
  fileName: string;
}

export default function QuizModal({ isOpen, onClose, quiz, fileName }: QuizModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isFinished, setIsFinished] = useState(false);

  if (!isOpen || !quiz || quiz.length === 0) return null;

  const currentQuestion = quiz[currentIndex];
  const hasAnsweredCurrent = selectedAnswers[currentIndex] !== undefined;

  const handleSelectOption = (option: string) => {
    if (hasAnsweredCurrent) return;
    
    setSelectedAnswers(prev => ({
      ...prev,
      [currentIndex]: option
    }));
  };

  const handleNext = () => {
    if (currentIndex < quiz.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleRetake = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setIsFinished(false);
  };

  const calculateScore = () => {
    let score = 0;
    quiz.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) score++;
    });
    return score;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
            <div className="flex items-center gap-2 text-[var(--accent-primary)] font-semibold">
              <BrainCircuit className="w-5 h-5" />
              <span>Practice Quiz</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 md:p-8 overflow-y-auto flex-1">
            {!isFinished ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-sm text-[var(--text-secondary)] font-medium mb-2">
                  <span>Question {currentIndex + 1} of {quiz.length}</span>
                  <span className="truncate max-w-[200px]">{fileName}</span>
                </div>
                
                <h3 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] leading-tight">
                  {currentQuestion.question}
                </h3>

                <div className="space-y-3 mt-8">
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = selectedAnswers[currentIndex] === option;
                    const isCorrect = option === currentQuestion.correctAnswer;
                    
                    let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 relative overflow-hidden ";
                    
                    if (!hasAnsweredCurrent) {
                      btnClass += "border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-tertiary)]";
                    } else {
                      if (isCorrect) {
                        btnClass += "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400";
                      } else if (isSelected && !isCorrect) {
                        btnClass += "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400";
                      } else {
                        btnClass += "border-[var(--border-color)] bg-[var(--bg-secondary)] opacity-50";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(option)}
                        disabled={hasAnsweredCurrent}
                        className={btnClass}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[var(--text-primary)]">{option}</span>
                          {hasAnsweredCurrent && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                          {hasAnsweredCurrent && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {hasAnsweredCurrent && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-6 flex justify-end"
                  >
                    <button
                      onClick={handleNext}
                      className="px-6 py-3 bg-[var(--accent-primary)] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                    >
                      {currentIndex === quiz.length - 1 ? "See Results" : "Next Question"}
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 space-y-6">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] mb-4">
                  <BrainCircuit className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-bold text-[var(--text-primary)]">Quiz Complete!</h2>
                
                <div className="text-6xl font-black text-[var(--accent-primary)] py-4">
                  {calculateScore()} <span className="text-2xl text-[var(--text-secondary)]">/ {quiz.length}</span>
                </div>
                
                <p className="text-[var(--text-secondary)] text-lg">
                  {calculateScore() === quiz.length ? "Perfect score! You're ready for the exam." : 
                   calculateScore() >= quiz.length / 2 ? "Good job! A little more studying and you'll master this." : 
                   "Keep studying! You'll get it next time."}
                </p>

                <div className="flex items-center justify-center gap-4 pt-8">
                  <button
                    onClick={handleRetake}
                    className="flex items-center gap-2 px-6 py-3 border-2 border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Retake
                  </button>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-[var(--accent-primary)] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

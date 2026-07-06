"use client";

import { useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X, Check, XCircle, BrainCircuit, RefreshCw, Layers } from "lucide-react";

export type Flashcard = {
  front: string;
  back: string;
};

interface FlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  flashcards: Flashcard[];
  fileName: string;
}

export default function FlashcardModal({ isOpen, onClose, flashcards, fileName }: FlashcardModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Stats
  const [knewIt, setKnewIt] = useState(0);
  const [needsReview, setNeedsReview] = useState(0);
  
  const isFinished = currentIndex >= (flashcards?.length || 0);

  if (!isOpen || !flashcards || flashcards.length === 0) return null;

  const handleDragEnd = (e: any, info: PanInfo) => {
    const swipeThreshold = 100;
    if (info.offset.x > swipeThreshold) {
      // Swiped Right - Knew it
      setKnewIt(prev => prev + 1);
      nextCard();
    } else if (info.offset.x < -swipeThreshold) {
      // Swiped Left - Needs Review
      setNeedsReview(prev => prev + 1);
      nextCard();
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 150);
  };

  const handleRetake = () => {
    setCurrentIndex(0);
    setKnewIt(0);
    setNeedsReview(0);
    setIsFlipped(false);
  };

  const currentCard = flashcards[currentIndex];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-[80vh] max-h-[800px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30 shrink-0">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Layers className="w-5 h-5" />
              <span>Practice Flashcards</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-background">
            {!isFinished ? (
              <>
                <div className="w-full flex items-center justify-between text-sm text-muted-foreground font-medium px-2 mb-2 shrink-0 z-10">
                  <span>Card {currentIndex + 1} of {flashcards.length}</span>
                  <span className="truncate max-w-[150px]">{fileName}</span>
                </div>
                
                {/* Swipe Indicators (hints) */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 opacity-30 pointer-events-none">
                  <XCircle className="w-8 h-8 text-destructive" />
                  <span className="text-xs font-bold rotate-[-90deg] mt-4 tracking-widest text-destructive">REVIEW</span>
                </div>
                
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 opacity-30 pointer-events-none">
                  <Check className="w-8 h-8 text-green-500" />
                  <span className="text-xs font-bold rotate-[90deg] mt-4 tracking-widest text-green-500">GOT IT</span>
                </div>

                <div className="relative w-full max-w-sm aspect-[3/4] perspective-1000 mt-2 z-20">
                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key={currentIndex}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      onDragEnd={handleDragEnd}
                      whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
                      className="absolute inset-0 w-full h-full cursor-grab"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ type: "spring", damping: 20, stiffness: 200 }}
                    >
                      {/* 3D Flip Container */}
                      <motion.div
                        className="w-full h-full relative"
                        style={{ transformStyle: "preserve-3d" }}
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                        onClick={() => setIsFlipped(!isFlipped)}
                      >
                        {/* Front of Card */}
                        <div className="absolute inset-0 w-full h-full bg-card border-2 border-border rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-card to-muted/50" style={{ backfaceVisibility: "hidden" }}>
                          <h3 className="text-3xl font-bold text-foreground">
                            {currentCard.front}
                          </h3>
                          <p className="text-muted-foreground text-sm mt-8 absolute bottom-6">
                            Tap to flip
                          </p>
                        </div>

                        {/* Back of Card */}
                        <div className="absolute inset-0 w-full h-full bg-primary/10 border-2 border-primary/30 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center" style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}>
                          <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed overflow-y-auto max-h-[80%] custom-scrollbar">
                            {currentCard.back}
                          </p>
                          <p className="text-primary/60 text-sm mt-8 absolute bottom-6 font-semibold">
                            Swipe Left (Review) &nbsp;|&nbsp; Swipe Right (Got it)
                          </p>
                        </div>
                      </motion.div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-8 w-full max-w-sm"
              >
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/20 text-primary mb-2 shadow-inner">
                  <BrainCircuit className="w-12 h-12" />
                </div>
                
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">Stack Completed!</h2>
                  <p className="text-muted-foreground">You went through all {flashcards.length} cards.</p>
                </div>
                
                <div className="flex gap-4 justify-center w-full">
                  <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex flex-col items-center">
                    <span className="text-4xl font-black text-green-500 mb-1">{knewIt}</span>
                    <span className="text-xs font-bold text-green-600/70 dark:text-green-400/70 tracking-wider">KNEW IT</span>
                  </div>
                  <div className="flex-1 bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex flex-col items-center">
                    <span className="text-4xl font-black text-destructive mb-1">{needsReview}</span>
                    <span className="text-xs font-bold text-destructive/70 tracking-wider">REVIEW</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-6 w-full">
                  <button
                    onClick={handleRetake}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Review Again
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full px-6 py-4 border-2 border-border text-foreground font-semibold rounded-xl hover:bg-muted transition-colors"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

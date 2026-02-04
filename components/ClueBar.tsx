import React from 'react';
import { Direction } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ClueBarProps {
  clue: string;
  direction: Direction;
  clueNumber: number;
  onNext: () => void;
  onPrev: () => void;
}

export const ClueBar: React.FC<ClueBarProps> = ({ clue, direction, clueNumber, onNext, onPrev }) => {
  return (
    <div className="px-4 py-2 w-full">
        <div className="bg-dark-900/50 backdrop-blur-md border border-neon-purple/20 rounded-2xl p-4 flex items-center justify-between shadow-[0_0_20px_rgba(0,0,0,0.2)] ring-1 ring-white/5">
            <button onClick={onPrev} className="p-3 hover:bg-white/5 rounded-xl text-neon-cyan transition-colors active:scale-90">
                <ChevronLeft className="w-6 h-6" />
            </button>
            
            <div className="flex-1 text-center px-2">
                <div className="inline-flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-black bg-neon-purple px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(114,9,183,0.5)]">
                        {clueNumber}
                    </span>
                    <span className="text-[10px] font-mono text-neon-purple uppercase tracking-widest opacity-80">
                        {direction}
                    </span>
                </div>
                <div className="font-sans font-medium text-white text-lg leading-tight drop-shadow-md line-clamp-2">
                    {clue || <span className="text-gray-500 italic text-base">Select a word...</span>}
                </div>
            </div>

            <button onClick={onNext} className="p-3 hover:bg-white/5 rounded-xl text-neon-cyan transition-colors active:scale-90">
                <ChevronRight className="w-6 h-6" />
            </button>
        </div>
    </div>
  );
};
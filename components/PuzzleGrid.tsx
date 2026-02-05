import React from 'react';
import { CellData } from '../types';

interface PuzzleGridProps {
  grid: CellData[][];
  onCellClick: (row: number, col: number) => void;
}

export const PuzzleGrid: React.FC<PuzzleGridProps> = ({ grid, onCellClick }) => {
  const size = grid.length;
  
  // Dynamic text sizing based on grid dimension
  const getTextSize = () => {
    if (size <= 5) return 'text-3xl';
    if (size <= 7) return 'text-2xl';
    if (size <= 10) return 'text-xl';
    return 'text-sm';
  };

  const textSize = getTextSize();

  return (
    <div className="flex justify-center items-center w-full h-full py-4 px-2">
      <div 
        className="grid gap-[2px] p-2 bg-slate-950 rounded-xl border border-slate-800 shadow-2xl"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          maxWidth: size > 10 ? '600px' : size > 7 ? '550px' : '400px',
          width: '100%',
          aspectRatio: '1/1'
        }}
      >
        {grid.map((row, rIndex) => (
          row.map((cell, cIndex) => {
            if (cell.isBlack) {
                return (
                    <div 
                        key={`${rIndex}-${cIndex}`} 
                        className="bg-black/40 rounded-sm"
                    />
                );
            }

            const isActive = cell.active;
            const isRelated = cell.related;
            const isWordComplete = cell.isWordComplete;
            const isError = cell.isError;
            const isRevealed = cell.isRevealed;
            
            // Base Styles for 2D Block
            let bgClass = 'bg-slate-800';
            let textClass = 'text-slate-300';
            let borderClass = 'border-slate-700';
            let activeGlow = '';
            
            if (isActive) {
                bgClass = 'bg-fuchsia-600';
                textClass = 'text-white';
                borderClass = 'border-fuchsia-400';
                activeGlow = 'shadow-[0_0_15px_rgba(217,70,239,0.6)] z-20 scale-105';
            } else if (isWordComplete) {
                bgClass = 'bg-emerald-600';
                textClass = 'text-white';
                borderClass = 'border-emerald-400';
            } else if (isError) {
                bgClass = 'bg-red-900/50';
                textClass = 'text-red-400';
                borderClass = 'border-red-500';
            } else if (isRelated) {
                bgClass = 'bg-slate-700';
                textClass = 'text-fuchsia-200';
                borderClass = 'border-slate-600';
            }

            // Visual feedback for revealed letters (if word not yet complete)
            if (isRevealed && !isWordComplete && !isActive) {
                textClass = 'text-yellow-400';
            }

            return (
              <div
                key={`${rIndex}-${cIndex}`}
                onClick={() => onCellClick(rIndex, cIndex)}
                className={`
                  relative flex items-center justify-center 
                  cursor-pointer select-none transition-all duration-150
                  ${bgClass} ${textClass} ${textSize} ${borderClass}
                  border rounded-md font-bold uppercase
                  hover:brightness-125
                  ${activeGlow}
                `}
              >
                {/* Number Label */}
                {cell.number && (
                  <span className={`absolute top-0.5 left-1 ${size >= 10 ? 'text-[8px]' : 'text-[10px]'} font-mono opacity-70 leading-none`}>
                    {cell.number}
                  </span>
                )}
                
                <span className="relative z-10 translate-y-[1px]">{cell.userValue}</span>
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
};

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
                        className="bg-black/60 rounded-sm"
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
                // Active Cursor Cell - Super Bright & Pop
                bgClass = 'bg-fuchsia-500';
                textClass = 'text-white font-black';
                borderClass = 'border-fuchsia-300';
                activeGlow = 'shadow-[0_0_20px_rgba(217,70,239,0.7)] z-30 scale-110 ring-2 ring-white/50';
            } else if (isWordComplete) {
                // Completed Word - Emerald Green
                bgClass = 'bg-emerald-600';
                textClass = 'text-emerald-50';
                borderClass = 'border-emerald-400';
            } else if (isError) {
                // Error State - Red
                bgClass = 'bg-red-900/80';
                textClass = 'text-red-200';
                borderClass = 'border-red-500';
            } else if (isRelated) {
                // Highlighted Word Track - Purple Tint (High Visibility)
                bgClass = 'bg-purple-900/90'; // Much darker/richer purple to stand out from slate
                textClass = 'text-white';
                borderClass = 'border-purple-400/70'; // Brighter border
            }

            // Visual feedback for revealed letters (if word not yet complete)
            if (isRevealed && !isWordComplete && !isActive) {
                textClass = 'text-yellow-400';
                if (!isRelated && !isError) borderClass = 'border-yellow-500/50';
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
                  hover:brightness-110
                  ${activeGlow}
                `}
              >
                {/* Number Label */}
                {cell.number && (
                  <span className={`absolute top-0.5 left-1 ${size >= 10 ? 'text-[8px]' : 'text-[10px]'} font-mono opacity-80 leading-none pointer-events-none`}>
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

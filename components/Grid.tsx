import React, { useEffect } from 'react';
import { GridCell, CellPosition, Direction } from '../types';

interface GridProps {
  grid: GridCell[][];
  width: number;
  height: number;
  selectedCell: CellPosition | null;
  selectedDirection: Direction;
  onCellClick: (pos: CellPosition) => void;
}

export const Grid: React.FC<GridProps> = ({
  grid,
  width,
  height,
  selectedCell,
  selectedDirection,
  onCellClick,
}) => {
  // Auto-scroll to selected cell logic
  useEffect(() => {
    if (selectedCell) {
      const cellId = `cell-${selectedCell.row}-${selectedCell.col}`;
      const element = document.getElementById(cellId);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }
  }, [selectedCell]);

  return (
    <div className="flex justify-center items-center w-full min-h-full p-4 custom-scrollbar">
        <div 
          className="grid gap-[2px] p-2 bg-dark-900/40 backdrop-blur-sm rounded-xl border border-white/5 shadow-2xl select-none touch-manipulation transition-all duration-300 ease-in-out"
          style={{
            gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
            aspectRatio: `${width}/${height}`,
            width: '100%',
            // Responsive Max Widths
            maxWidth: width > 12 ? '900px' : '650px', 
            minWidth: '300px'
          }}
        >
          {grid.map((row, rIdx) => (
            row.map((cell, cIdx) => {
              if (cell.isBlack) {
                return (
                  <div 
                    key={`${rIdx}-${cIdx}`} 
                    className="bg-transparent rounded-sm w-full h-full"
                  />
                );
              }

              const isSelected = selectedCell?.row === rIdx && selectedCell?.col === cIdx;
              const currentWordId = selectedCell ? grid[selectedCell.row][selectedCell.col].wordIds[selectedDirection] : undefined;
              const isRelated = selectedCell && currentWordId && cell.wordIds[selectedDirection] === currentWordId;
              
              // Base Style - Significantly lighter than background (#020410)
              // bg-dark-700 is #242D45
              let baseClasses = "bg-dark-700 text-gray-200 border border-transparent";
              
              // Conditional Styles
              if (isSelected) {
                // Bright Neon Selection
                baseClasses = "bg-neon-purple text-white border-neon-cyan shadow-[0_0_15px_rgba(76,201,240,0.6)] z-20 scale-105 ring-2 ring-neon-cyan";
              } else if (isRelated) {
                // Related word highlight
                baseClasses = "bg-neon-purple/20 text-white border-neon-purple/30";
              } else if (cell.status === 'correct') {
                // Correct answer
                baseClasses = "bg-teal-900/60 text-neon-green border-neon-green/30";
              } else if (cell.status === 'incorrect') {
                // Error state
                baseClasses = "bg-red-900/50 text-red-200 border-red-500 animate-pulse";
              } else if (cell.status === 'locked') {
                // Revealed
                baseClasses = "bg-dark-600 text-gray-400 border-dashed border-gray-600";
              }

              const showClueNum = cell.clueNumbers[Direction.ACROSS] || cell.clueNumbers[Direction.DOWN];
              
              // Dynamic font size based on width/grid density
              const fontSizeClass = width > 12 
                ? 'text-[10px] sm:text-xs md:text-sm lg:text-base' 
                : 'text-base sm:text-lg md:text-xl lg:text-2xl';

              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  id={`cell-${rIdx}-${cIdx}`}
                  onClick={() => onCellClick({ row: rIdx, col: cIdx })}
                  className={`
                    relative flex items-center justify-center 
                    font-sans font-bold uppercase cursor-pointer transition-all duration-150
                    rounded-md
                    aspect-square
                    ${fontSizeClass}
                    ${baseClasses}
                    hover:brightness-125
                  `}
                >
                  {showClueNum ? (
                    <span className="absolute top-[1px] left-[2px] text-[0.45rem] md:text-[0.6rem] leading-none text-gray-400 font-mono opacity-80 pointer-events-none">
                      {showClueNum}
                    </span>
                  ) : null}
                  {cell.value}
                </div>
              );
            })
          ))}
        </div>
    </div>
  );
};
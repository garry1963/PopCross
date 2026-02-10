import React from 'react';
import { Delete } from 'lucide-react';

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onEnter?: () => void;
}

const KEYS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ onKeyPress, onDelete }) => {
  return (
    <div className="w-full max-w-2xl mx-auto p-1 select-none">
      <div className="flex flex-col gap-2">
        {KEYS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1 sm:gap-1.5 w-full">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => onKeyPress(key)}
                className="
                  group relative
                  flex-1 max-w-[42px] sm:max-w-[50px] 
                  h-12 sm:h-14 md:h-16
                  bg-slate-800 border-b-4 border-slate-950 rounded-lg
                  active:border-b-0 active:translate-y-1 active:bg-slate-700
                  transition-all duration-75
                  flex items-center justify-center
                  text-lg sm:text-xl md:text-2xl font-bold text-slate-200
                  hover:bg-slate-700 hover:text-white hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]
                "
              >
                {key}
              </button>
            ))}
            {rowIndex === 2 && (
              <button
                onClick={onDelete}
                className="
                  flex-1 max-w-[56px] sm:max-w-[70px]
                  h-12 sm:h-14 md:h-16
                  bg-slate-800/80 border-b-4 border-slate-950 rounded-lg
                  active:border-b-0 active:translate-y-1
                  flex items-center justify-center text-red-400
                  hover:bg-red-900/20 hover:text-red-300 transition-colors ml-1 sm:ml-1.5
                "
              >
                <Delete className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
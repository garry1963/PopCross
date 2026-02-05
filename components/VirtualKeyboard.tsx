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
      <div className="flex flex-col gap-1.5">
        {KEYS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => onKeyPress(key)}
                className="
                  group relative w-8 h-10 sm:w-10 sm:h-12 
                  bg-slate-800 border-b-2 border-slate-950 rounded-md
                  active:border-b-0 active:translate-y-0.5 active:bg-slate-700
                  transition-all duration-75
                  flex items-center justify-center
                  text-sm sm:text-base font-bold text-slate-200
                  hover:bg-slate-700 hover:text-white hover:shadow-[0_0_8px_rgba(255,255,255,0.1)]
                "
              >
                {key}
              </button>
            ))}
            {rowIndex === 2 && (
              <button
                onClick={onDelete}
                className="
                  w-12 h-10 sm:w-14 sm:h-12 
                  bg-slate-800/80 border-b-2 border-slate-950 rounded-md
                  active:border-b-0 active:translate-y-0.5
                  flex items-center justify-center text-red-400
                  hover:bg-red-900/20 hover:text-red-300 transition-colors ml-1
                "
              >
                <Delete size={18} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

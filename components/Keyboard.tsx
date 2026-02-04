import React from 'react';
import { Delete, CheckCircle2, Wand2, Type, CornerDownLeft } from 'lucide-react';

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onEnter: () => void; 
  onRevealLetter: () => void;
  onRevealWord: () => void;
  onCheck: () => void;
  userStars: number;
}

const KEYS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

export const Keyboard: React.FC<KeyboardProps> = ({ 
  onKeyPress, 
  onDelete, 
  onEnter, 
  onRevealLetter, 
  onRevealWord,
  onCheck,
  userStars 
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto p-2 pb-4 lg:pb-6 z-20">
      
      {/* Tools Bar */}
      <div className="flex justify-between items-center mb-3 px-2 gap-2">
         
         <button 
           onClick={onCheck}
           className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-800 text-gray-300 border border-white/5 hover:text-white hover:border-neon-green hover:bg-neon-green/10 transition-all text-xs font-bold uppercase tracking-wider"
         >
           <CheckCircle2 className="w-4 h-4" /> Check
         </button>

         <div className="flex gap-2">
            <button 
              onClick={onRevealLetter}
              disabled={userStars < 10}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all text-xs font-bold uppercase ${
                userStars >= 10 
                  ? 'bg-neon-purple/10 text-neon-purple border-neon-purple/50 hover:bg-neon-purple/20 shadow-[0_0_10px_rgba(114,9,183,0.3)]' 
                  : 'bg-dark-900 text-gray-700 border-white/5 cursor-not-allowed'
              }`}
            >
              <Type className="w-4 h-4" /> Hint (-10)
            </button>

            <button 
              onClick={onRevealWord}
              disabled={userStars < 25}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all text-xs font-bold uppercase ${
                userStars >= 25 
                  ? 'bg-neon-pink/10 text-neon-pink border-neon-pink/50 hover:bg-neon-pink/20 shadow-[0_0_10px_rgba(247,37,133,0.3)]' 
                  : 'bg-dark-900 text-gray-700 border-white/5 cursor-not-allowed'
              }`}
            >
              <Wand2 className="w-4 h-4" /> Word (-25)
            </button>
         </div>

      </div>
      
      {/* Keys */}
      <div className="flex flex-col gap-1.5 select-none">
        {KEYS.map((row, i) => (
          <div key={i} className="flex justify-center gap-1.5">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => onKeyPress(key)}
                className="h-10 sm:h-12 w-8 sm:w-10 md:w-12 flex items-center justify-center rounded-lg bg-dark-800 text-gray-200 font-bold active:bg-neon-cyan active:text-black active:scale-95 transition-all shadow-[0_3px_0_rgba(0,0,0,0.5)] active:shadow-none active:translate-y-[3px] border-t border-white/10 text-sm sm:text-base"
              >
                {key}
              </button>
            ))}
          </div>
        ))}
        <div className="flex justify-center gap-3 mt-2 px-1 sm:px-4">
           <button
            onClick={onEnter}
            className="h-10 sm:h-12 flex-1 rounded-xl bg-dark-700 text-neon-cyan font-black text-xs uppercase active:bg-neon-cyan active:text-black transition-all shadow-[0_3px_0_rgba(0,0,0,0.5)] active:shadow-none active:translate-y-[3px] border border-neon-cyan/20 flex items-center justify-center gap-2"
          >
            Next <CornerDownLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="h-10 sm:h-12 w-20 flex items-center justify-center rounded-xl bg-dark-800 text-red-400 active:bg-red-500 active:text-white transition-all shadow-[0_3px_0_rgba(0,0,0,0.5)] active:shadow-none active:translate-y-[3px] border border-white/5"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
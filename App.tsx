import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, CellData, Direction, TopicId, Category, GameSettings, UserStats, Badge, Clue, Region } from './types';
import { generatePuzzle, getHintForCell } from './services/geminiService';
import { getDailyPuzzleFromDb, saveDailyPuzzleToDb, saveGameState, loadGameState, clearGameState } from './services/storageService';
import { PuzzleGrid } from './components/PuzzleGrid';
import { VirtualKeyboard } from './components/VirtualKeyboard';
import { 
  Clapperboard, Music, Tv, Loader2, Sparkles, Trophy, 
  Share2, Play, Zap, Calendar, Globe, Eye, Type, AlertCircle, Save,
  Home, Grid, User, Settings, Skull, Mic2, Star, Disc, Film, Gamepad2, Volume2, VolumeX, Medal,
  Laugh, Guitar, Sword, Smartphone, Check, Eye as EyeIcon, Type as TypeIcon, Hash, ArrowLeft, Brain, BookOpen, MapPin, Flag
} from 'lucide-react';

// --- Configuration & Data ---

const CATEGORIES: Category[] = [
  { id: 'General', label: 'General', icon: <Brain size={20}/>, color: 'text-teal-400', description: 'Trivia & Variety' },
  { id: 'General Knowledge', label: 'Gen Knowledge', icon: <BookOpen size={20}/>, color: 'text-lime-400', description: 'History, Science & Geo' },
  { id: 'Movies', label: 'Movies', icon: <Clapperboard size={20}/>, color: 'text-pink-400', description: 'Blockbusters & Classics' },
  { id: 'TV Shows', label: 'TV Shows', icon: <Tv size={20}/>, color: 'text-blue-400', description: 'Binge-worthy Series' },
  { id: 'Music', label: 'Music', icon: <Music size={20}/>, color: 'text-purple-400', description: 'Top Charts & Legends' },
  { id: '90s', label: '90s Era', icon: <Gamepad2 size={20}/>, color: 'text-yellow-400', description: 'Nostalgia Trip' },
  { id: '2000s', label: '2000s', icon: <Disc size={20}/>, color: 'text-cyan-400', description: 'Y2K Pop Culture' },
  { id: 'Modern', label: 'Modern', icon: <Smartphone size={20}/>, color: 'text-emerald-400', description: 'Viral & Trending' },
  { id: 'Horror', label: 'Horror', icon: <Skull size={20}/>, color: 'text-red-500', description: 'Spooky Season' },
  { id: 'Sci-Fi', label: 'Sci-Fi', icon: <Globe size={20}/>, color: 'text-green-400', description: 'Space & Future' },
  { id: 'Comedy', label: 'Comedy', icon: <Laugh size={20}/>, color: 'text-orange-400', description: 'Sitcoms & Stand-up' },
  { id: 'Hip-Hop', label: 'Hip-Hop', icon: <Disc size={20}/>, color: 'text-amber-400', description: 'Bars & Beats' },
  { id: 'Rock', label: 'Rock', icon: <Guitar size={20}/>, color: 'text-rose-400', description: 'Legends & Anthems' },
  { id: 'Pop Divas', label: 'Pop Divas', icon: <Mic2 size={20}/>, color: 'text-fuchsia-400', description: 'Queens of Pop' },
  { id: 'Superheroes', label: 'Heroes', icon: <Zap size={20}/>, color: 'text-blue-500', description: 'Marvel & DC' },
  { id: 'Reality TV', label: 'Reality', icon: <Eye size={20}/>, color: 'text-indigo-400', description: 'Drama & Unscripted' },
  { id: 'Anime', label: 'Anime', icon: <Sword size={20}/>, color: 'text-pink-500', description: 'Japan & Animation' },
];

const BADGES: Badge[] = [
    { id: 'first_win', name: 'First Cut', icon: '🎬', description: 'Complete your first puzzle', unlocked: false },
    { id: 'streak_3', name: 'On Fire', icon: '🔥', description: 'Reach a 3-day streak', unlocked: false },
    { id: 'pop_star', name: 'Pop Star', icon: '⭐', description: 'Reach Level 5', unlocked: false },
    { id: 'expert_solver', name: 'Cinephile', icon: '🎥', description: 'Solve a Hard puzzle without hints', unlocked: false },
];

const INITIAL_STATS: UserStats = {
  totalPoints: 0,
  level: 1,
  xp: 0,
  xpToNextLevel: 1000,
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastDailyDate: null,
  badges: BADGES
};

const INITIAL_SETTINGS: GameSettings = {
    difficulty: 'Medium',
    region: 'Global',
    soundEnabled: true,
    hapticEnabled: true
};

const POINTS_BY_DIFFICULTY: Record<string, number> = {
  'Easy': 500,
  'Medium': 1000,
  'Hard': 2500,
  'Expert': 5000
};

const HINT_PENALTY = 50;
const REVEAL_LETTER_PENALTY = 25;
const REVEAL_WORD_PENALTY = 100;

export default function App() {
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
  const [gameState, setGameState] = useState<GameState>({
    view: 'home',
    status: 'idle',
    puzzle: null,
    grid: [],
    selectedCell: null,
    direction: 'across',
    timer: 0,
    hintsUsed: 0,
    revealsUsed: 0,
    score: 0,
    isDaily: false,
    settings: INITIAL_SETTINGS
  });

  const [aiHint, setAiHint] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [savedGameExists, setSavedGameExists] = useState(false);
  const [showRevealMenu, setShowRevealMenu] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // --- Persistence ---
  useEffect(() => {
    const savedStats = localStorage.getItem('popcross_stats_v2');
    if (savedStats) setStats(JSON.parse(savedStats));

    const savedGame = loadGameState();
    if (savedGame) setSavedGameExists(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('popcross_stats_v2', JSON.stringify(stats));
  }, [stats]);

  // Optimized Autosave Logic
  useEffect(() => {
    if (gameState.status === 'playing') {
      // Debounce the save operation to avoid writing to disk on every keystroke/timer tick
      setIsAutoSaving(true);
      const saveTimeout = setTimeout(() => {
        saveGameState(gameState);
        setIsAutoSaving(false);
      }, 1000);

      return () => clearTimeout(saveTimeout);
    } else if (gameState.status === 'completed') {
       clearGameState();
       setSavedGameExists(false);
    }
  }, [
    // Trigger save on these changes (moves), but NOT on every second of the timer
    gameState.grid, 
    gameState.score, 
    gameState.hintsUsed, 
    gameState.revealsUsed, 
    gameState.status
  ]);

  // Separate Timer Saver (Less frequent)
  useEffect(() => {
    if (gameState.status === 'playing') {
        const timerSaveInterval = setInterval(() => {
            saveGameState(gameState); // Snapshot timer every 30s
        }, 30000);
        return () => clearInterval(timerSaveInterval);
    }
  }, [gameState.status, gameState.timer]);

  // --- Game Loop ---
  useEffect(() => {
    let interval: number;
    if (gameState.status === 'playing') {
      interval = window.setInterval(() => {
        setGameState(prev => ({ ...prev, timer: prev.timer + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState.status]);

  // --- Logic ---

  const checkWordCompletions = (grid: CellData[][], clues: Clue[]): CellData[][] => {
      // Create a clean grid copy or at least reset isWordComplete to avoid stale state
      const nextGrid = grid.map(row => row.map(cell => ({...cell, isWordComplete: false})));
      const completeCells = new Set<string>();

      clues.forEach(clue => {
          let isComplete = true;
          // Check Across
          if (clue.direction === 'across') {
              for(let i=0; i<clue.answer.length; i++) {
                  const targetR = clue.row;
                  const targetC = clue.col + i;
                  if (!nextGrid[targetR] || !nextGrid[targetR][targetC] || nextGrid[targetR][targetC].userValue !== nextGrid[targetR][targetC].value) {
                      isComplete = false;
                      break;
                  }
              }
              if (isComplete) {
                  for(let i=0; i<clue.answer.length; i++) {
                      completeCells.add(`${clue.row},${clue.col + i}`);
                  }
              }
          } 
          // Check Down
          else {
              for(let i=0; i<clue.answer.length; i++) {
                  const targetR = clue.row + i;
                  const targetC = clue.col;
                  if (!nextGrid[targetR] || !nextGrid[targetR][targetC] || nextGrid[targetR][targetC].userValue !== nextGrid[targetR][targetC].value) {
                      isComplete = false;
                      break;
                  }
              }
              if (isComplete) {
                  for(let i=0; i<clue.answer.length; i++) {
                      completeCells.add(`${clue.row + i},${clue.col}`);
                  }
              }
          }
      });

      // Apply completions
      completeCells.forEach(key => {
          const [r, c] = key.split(',').map(Number);
          if (nextGrid[r] && nextGrid[r][c]) {
            nextGrid[r][c].isWordComplete = true;
          }
      });
      
      return nextGrid;
  };

  const checkLevelUp = (currentStats: UserStats, pointsToAdd: number): UserStats => {
      let { level, xp, xpToNextLevel, badges } = currentStats;
      xp += pointsToAdd;
      
      while (xp >= xpToNextLevel) {
          xp -= xpToNextLevel;
          level++;
          xpToNextLevel = Math.floor(xpToNextLevel * 1.2); // Curve
      }

      // Check Badges
      const newBadges = badges.map(b => {
          if (b.id === 'first_win' && currentStats.gamesWon + 1 >= 1) return { ...b, unlocked: true };
          if (b.id === 'streak_3' && currentStats.currentStreak >= 3) return { ...b, unlocked: true };
          if (b.id === 'pop_star' && level >= 5) return { ...b, unlocked: true };
          return b;
      });

      return {
          ...currentStats,
          level,
          xp,
          xpToNextLevel,
          badges: newBadges
      };
  };

  const initGameFromPuzzle = (puzzle: any, isDaily: boolean, prevGameState: any) => {
      const newGrid: CellData[][] = puzzle.grid.map((row: string[], r: number) => 
        row.map((char: string, c: number) => ({
          row: r,
          col: c,
          value: char,
          userValue: '',
          isBlack: char === '.',
          number: null,
          active: false,
          related: false,
          isCorrect: false,
          isRevealed: false,
          isWordComplete: false
        }))
      );

      puzzle.clues.forEach((clue: Clue) => {
         if (newGrid[clue.row] && newGrid[clue.row][clue.col]) {
             newGrid[clue.row][clue.col].number = clue.number;
         }
      });

      // Find first non-black cell
      let startR = 0, startC = 0;
      outer: for(let r=0; r<newGrid.length; r++) {
          for(let c=0; c<newGrid.length; c++) {
              if (!newGrid[r][c].isBlack) {
                  startR = r; startC = c;
                  break outer;
              }
          }
      }

      const newState: GameState = {
        ...prevGameState,
        status: 'playing',
        puzzle,
        grid: newGrid,
        selectedCell: { row: startR, col: startC },
        direction: 'across',
        timer: 0,
        hintsUsed: 0,
        revealsUsed: 0,
        score: 0,
        isDaily,
        view: 'game'
      };

      setGameState(newState);
      updateSelectionHighlights(newGrid, { row: startR, col: startC }, 'across', newState);
  }

  const startNewGame = async (topic: string, isDaily: boolean = false) => {
    setGameState(prev => ({ 
      ...prev, 
      status: 'generating', 
      hintsUsed: 0, 
      revealsUsed: 0, 
      timer: 0,
      score: 0,
      isDaily,
      view: 'game'
    }));
    setAiHint(null);
    setShowRevealMenu(false);

    // 1. Check Local DB for Daily Puzzle (Instant Load)
    if (isDaily) {
        const cachedDaily = getDailyPuzzleFromDb();
        if (cachedDaily) {
            console.log("Loading Daily from Cache");
            initGameFromPuzzle(cachedDaily, true, gameState);
            return;
        }
    }

    // 2. Fallback to API Generation
    try {
      const theme = isDaily ? "Daily Mix" : topic;
      const puzzle = await generatePuzzle(theme, gameState.settings.difficulty, gameState.settings.region);
      
      // Cache the result if it's the daily puzzle
      if (isDaily) {
          saveDailyPuzzleToDb(puzzle);
      }

      initGameFromPuzzle(puzzle, isDaily, gameState);

    } catch (error: any) {
      console.error(error);
      setGameState(prev => ({ ...prev, status: 'idle', view: 'home' }));
      alert(error.message || "Failed to generate puzzle. Please check your network or API key.");
    }
  };

  const updateSelectionHighlights = (
    currentGrid: CellData[][], 
    selected: { row: number, col: number } | null, 
    dir: Direction,
    stateOverride?: GameState
  ) => {
    if (!selected) return;

    const newGrid = currentGrid.map(row => row.map(cell => ({ ...cell, active: false, related: false })));
    newGrid[selected.row][selected.col].active = true;

    if (dir === 'across') {
      // Highlight across word (stop at black squares)
      let c = selected.col;
      while(c >= 0 && !newGrid[selected.row][c].isBlack) { newGrid[selected.row][c].related = true; c--; }
      c = selected.col + 1;
      while(c < newGrid.length && !newGrid[selected.row][c].isBlack) { newGrid[selected.row][c].related = true; c++; }
    } else {
      // Highlight down word
      let r = selected.row;
      while(r >= 0 && !newGrid[r][selected.col].isBlack) { newGrid[r][selected.col].related = true; r--; }
      r = selected.row + 1;
      while(r < newGrid.length && !newGrid[r][selected.col].isBlack) { newGrid[r][selected.col].related = true; r++; }
    }

    setGameState(prev => ({ 
        ...(stateOverride || prev), 
        grid: newGrid, 
        selectedCell: selected, 
        direction: dir 
    }));
  };

  const handleCellClick = (row: number, col: number) => {
    if (gameState.status !== 'playing') return;
    if (gameState.grid[row][col].isBlack) return;

    if (gameState.selectedCell?.row === row && gameState.selectedCell?.col === col) {
      const newDir = gameState.direction === 'across' ? 'down' : 'across';
      updateSelectionHighlights(gameState.grid, { row, col }, newDir);
    } else {
      updateSelectionHighlights(gameState.grid, { row, col }, gameState.direction);
    }
  };

  const handleInput = useCallback((char: string) => {
    if (gameState.status !== 'playing' || !gameState.selectedCell || !gameState.puzzle) return;
    const { row, col } = gameState.selectedCell;
    
    if (gameState.grid[row][col].isRevealed || gameState.grid[row][col].isBlack) return;

    const newGrid = [...gameState.grid];
    newGrid[row][col] = { 
        ...newGrid[row][col], 
        userValue: char, 
        isCorrect: char === newGrid[row][col].value,
        isError: false // Clear error when typing
    };

    // Smart Navigation: Skip black squares
    let nextRow = row;
    let nextCol = col;
    
    // Simple Next Cell Logic (Can be improved to jump black squares)
    if (gameState.direction === 'across') {
       if (col < newGrid.length - 1 && !newGrid[row][col+1].isBlack) nextCol++;
    } else {
       if (row < newGrid.length - 1 && !newGrid[row+1][col].isBlack) nextRow++;
    }

    const gridWithCompletions = checkWordCompletions(newGrid, gameState.puzzle.clues);
    updateSelectionHighlights(gridWithCompletions, { row: nextRow, col: nextCol }, gameState.direction);
    checkWinCondition(gridWithCompletions);
  }, [gameState]);

    const handleBackspace = useCallback(() => {
    if (gameState.status !== 'playing' || !gameState.selectedCell || !gameState.puzzle) return;
    const { row, col } = gameState.selectedCell;
    const newGrid = [...gameState.grid];
    
    if (newGrid[row][col].isRevealed) return;

    if (newGrid[row][col].userValue === '') {
        let prevRow = row;
        let prevCol = col;
        if (gameState.direction === 'across') {
            if (col > 0 && !newGrid[row][col-1].isBlack) prevCol--;
        } else {
            if (row > 0 && !newGrid[row-1][col].isBlack) prevRow--;
        }
        updateSelectionHighlights(newGrid, { row: prevRow, col: prevCol }, gameState.direction);
    } else {
        newGrid[row][col].userValue = '';
        newGrid[row][col].isError = false; // Clear error on delete
        // If we delete, a word might become incomplete, so re-run check
        const gridWithCompletions = checkWordCompletions(newGrid, gameState.puzzle.clues);
        setGameState(prev => ({ ...prev, grid: gridWithCompletions }));
    }
  }, [gameState]);

  const checkWinCondition = (grid: CellData[][]) => {
    const allCorrect = grid.every(row => row.every(cell => cell.isBlack || cell.userValue === cell.value));
    if (allCorrect) {
      const basePoints = POINTS_BY_DIFFICULTY[gameState.settings.difficulty];
      const timeBonus = Math.max(0, 500 - (gameState.timer * 2));
      const penalty = (gameState.hintsUsed * HINT_PENALTY) + (gameState.revealsUsed); 
      const finalScore = Math.max(0, basePoints + timeBonus - penalty); 

      setGameState(prev => ({ ...prev, status: 'completed', score: finalScore }));

      const today = new Date().toISOString().split('T')[0];
      setStats(prev => {
        const isNewDay = prev.lastDailyDate !== today;
        let newStreak = prev.currentStreak;
        if (gameState.isDaily && isNewDay) newStreak += 1;
        
        const newStats = {
          ...prev,
          totalPoints: prev.totalPoints + finalScore,
          gamesPlayed: prev.gamesPlayed + 1,
          gamesWon: prev.gamesWon + 1,
          currentStreak: newStreak,
          maxStreak: Math.max(prev.maxStreak, newStreak),
          lastDailyDate: gameState.isDaily ? today : prev.lastDailyDate
        };

        return checkLevelUp(newStats, finalScore);
      });
    }
  };

  const handleCheckPuzzle = () => {
    if (!gameState.grid) return;
    const newGrid = gameState.grid.map(row => row.map(cell => {
      if (!cell.isBlack && cell.userValue !== '' && cell.userValue !== cell.value) {
        return { ...cell, isError: true };
      }
      return cell;
    }));
    setGameState(prev => ({ ...prev, grid: newGrid }));
  };

  const handleReveal = (type: 'cell' | 'word') => {
    if (!gameState.selectedCell || !gameState.grid || !gameState.puzzle) return;
    const { row, col } = gameState.selectedCell;
    const newGrid = [...gameState.grid];
    let penaltyToAdd = 0;

    if (type === 'cell') {
       if (!newGrid[row][col].isBlack && !newGrid[row][col].isRevealed) {
           newGrid[row][col] = {
               ...newGrid[row][col],
               userValue: newGrid[row][col].value,
               isCorrect: true,
               isRevealed: true,
               isError: false
           };
           penaltyToAdd = REVEAL_LETTER_PENALTY;
       }
    } else if (type === 'word') {
       // Reveal entire word based on direction
       if (gameState.direction === 'across') {
           // Go left
           let c = col;
           while(c >= 0 && !newGrid[row][c].isBlack) { 
               if (!newGrid[row][c].isRevealed) {
                    newGrid[row][c].userValue = newGrid[row][c].value;
                    newGrid[row][c].isCorrect = true;
                    newGrid[row][c].isRevealed = true;
                    newGrid[row][c].isError = false;
               }
               c--; 
            }
           // Go right
           c = col + 1;
           while(c < newGrid.length && !newGrid[row][c].isBlack) { 
                if (!newGrid[row][c].isRevealed) {
                    newGrid[row][c].userValue = newGrid[row][c].value;
                    newGrid[row][c].isCorrect = true;
                    newGrid[row][c].isRevealed = true;
                    newGrid[row][c].isError = false;
               }
               c++; 
            }
       } else {
           // Go up
           let r = row;
           while(r >= 0 && !newGrid[r][col].isBlack) { 
               if (!newGrid[r][col].isRevealed) {
                    newGrid[r][col].userValue = newGrid[r][col].value;
                    newGrid[r][col].isCorrect = true;
                    newGrid[r][col].isRevealed = true;
                    newGrid[r][col].isError = false;
               }
               r--; 
            }
           // Go down
           r = row + 1;
           while(r < newGrid.length && !newGrid[r][col].isBlack) { 
               if (!newGrid[r][col].isRevealed) {
                    newGrid[r][col].userValue = newGrid[r][col].value;
                    newGrid[r][col].isCorrect = true;
                    newGrid[r][col].isRevealed = true;
                    newGrid[r][col].isError = false;
               }
               r++; 
            }
       }
       penaltyToAdd = REVEAL_WORD_PENALTY;
    }

    const gridWithCompletions = checkWordCompletions(newGrid, gameState.puzzle.clues);
    setGameState(prev => ({ 
        ...prev, 
        grid: gridWithCompletions, 
        revealsUsed: prev.revealsUsed + penaltyToAdd 
    }));
    setShowRevealMenu(false);
    checkWinCondition(gridWithCompletions);
  };

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (gameState.status !== 'playing') return;
        if (e.key.match(/^[a-zA-Z]$/)) handleInput(e.key.toUpperCase());
        else if (e.key === 'Backspace') handleBackspace();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleInput, handleBackspace]);


  // AI and Hints
  const getCurrentClue = () => {
    if (!gameState.puzzle || !gameState.selectedCell) return null;
    const { row, col } = gameState.selectedCell;
    return gameState.puzzle.clues.find(c => {
      if (gameState.direction === 'across') return c.row === row && c.col <= col && (c.col + c.answer.length) > col && c.direction === 'across';
      if (gameState.direction === 'down') return c.col === col && c.row <= row && (c.row + c.answer.length) > row && c.direction === 'down';
      return false;
    });
  };

  const handleAskAI = async () => {
      const clue = getCurrentClue();
      if (!clue || isAiThinking) return;
      setIsAiThinking(true);
      
      try {
          // Construct simple pattern from grid
          const hint = await getHintForCell(clue.text, "___");
          setAiHint(hint);
          setGameState(prev => ({ 
              ...prev, 
              hintsUsed: prev.hintsUsed + 1 
          }));
      } catch (e) {
          setAiHint("Could not fetch hint.");
      } finally {
          setIsAiThinking(false);
      }
  };

  // --- Views ---

  const Navbar = () => (
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-md border-t border-white/5 flex justify-around items-center p-2 pb-6 lg:pb-2 z-50">
          <button onClick={() => setGameState(p => ({...p, view: 'home'}))} className={`p-2 flex flex-col items-center gap-1 ${gameState.view === 'home' ? 'text-fuchsia-400' : 'text-slate-500'}`}>
              <Home size={24} />
              <span className="text-[10px] uppercase font-bold tracking-wider">Home</span>
          </button>
          <button onClick={() => setGameState(p => ({...p, view: 'categories'}))} className={`p-2 flex flex-col items-center gap-1 ${gameState.view === 'categories' ? 'text-cyan-400' : 'text-slate-500'}`}>
              <Grid size={24} />
              <span className="text-[10px] uppercase font-bold tracking-wider">Topics</span>
          </button>
          <button onClick={() => setGameState(p => ({...p, view: 'profile'}))} className={`p-2 flex flex-col items-center gap-1 ${gameState.view === 'profile' ? 'text-amber-400' : 'text-slate-500'}`}>
              <User size={24} />
              <span className="text-[10px] uppercase font-bold tracking-wider">Stats</span>
          </button>
      </nav>
  );

  const HomeView = () => {
      const isDailyDone = stats.lastDailyDate === new Date().toISOString().split('T')[0];
      return (
          <div className="flex flex-col gap-8 w-full max-w-lg mx-auto pb-24 animate-[fade-in_0.5s_ease-out]">
             {/* Header Hero Section */}
             <div className="flex flex-col items-center text-center pt-8 pb-4 relative">
                {/* Decorative background glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 bg-fuchsia-500/20 blur-[80px] -z-10 rounded-full pointer-events-none"></div>

                {/* Points Pill */}
                <div className="flex items-center gap-2 mb-3">
                   <div className="px-4 py-1.5 rounded-full bg-slate-900/80 border border-white/10 flex items-center gap-2 shadow-lg backdrop-blur-md hover:border-yellow-500/50 transition-colors cursor-default">
                       <Star size={14} className="text-yellow-400 fill-yellow-400 animate-pulse" />
                       <span className="font-mono font-bold text-yellow-100 text-sm tracking-widest">{stats.totalPoints.toLocaleString()} PTS</span>
                   </div>
                </div>

                {/* Main Title */}
                <h1 className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-fuchsia-200 to-fuchsia-400 drop-shadow-[0_0_15px_rgba(217,70,239,0.5)] transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                    POPCROSS
                </h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mt-3 text-glow opacity-80">Infinite Culture Puzzles</p>
             </div>

             {/* Daily Card */}
             <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/20 to-purple-900/20 group-hover:opacity-100 opacity-50 transition-opacity"></div>
                 <h2 className="text-xs font-bold text-fuchsia-400 uppercase tracking-widest mb-1 relative z-10">Today's Feature</h2>
                 <h3 className="text-2xl font-bold text-white mb-4 relative z-10">The Daily Mix</h3>
                 
                 <div className="flex gap-4 mb-6 relative z-10">
                     <div className="flex flex-col">
                         <span className="text-slate-400 text-xs uppercase font-bold">Streak</span>
                         <span className="text-xl font-mono text-white flex items-center gap-1"><Zap size={16} className="text-yellow-400"/> {stats.currentStreak}</span>
                     </div>
                     <div className="flex flex-col border-l border-white/10 pl-4">
                         <span className="text-slate-400 text-xs uppercase font-bold">Difficulty</span>
                         <span className="text-xl font-mono text-white">Mixed</span>
                     </div>
                 </div>

                 <button 
                    onClick={() => startNewGame("Daily Mix", true)}
                    disabled={isDailyDone}
                    className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all relative z-10
                    ${isDailyDone 
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5' 
                        : 'bg-white text-slate-900 hover:bg-fuchsia-50 hover:text-fuchsia-900 hover:shadow-[0_0_20px_rgba(217,70,239,0.4)]'
                    }`}
                 >
                    {isDailyDone ? "Completed" : "Play Daily Puzzle"}
                 </button>
             </div>

             {/* Quick Actions */}
             <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Quick Play</h3>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => startNewGame('Movies')} className="p-4 bg-slate-900/50 border border-white/5 rounded-xl flex items-center gap-3 hover:border-pink-500/50 transition-colors group">
                        <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400 group-hover:scale-110 transition-transform"><Clapperboard size={20}/></div>
                        <span className="font-bold">Movies</span>
                    </button>
                    <button onClick={() => startNewGame('Music')} className="p-4 bg-slate-900/50 border border-white/5 rounded-xl flex items-center gap-3 hover:border-purple-500/50 transition-colors group">
                        <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400 group-hover:scale-110 transition-transform"><Music size={20}/></div>
                        <span className="font-bold">Music</span>
                    </button>
                    {savedGameExists && (
                         <button onClick={() => { setGameState(loadGameState() || gameState); }} className="col-span-2 p-4 bg-gradient-to-r from-slate-800 to-slate-900 border border-fuchsia-500/30 rounded-xl flex justify-center items-center gap-3 hover:border-fuchsia-500 transition-colors">
                            <span className="font-bold text-fuchsia-300">Resume Last Session</span>
                        </button>
                    )}
                </div>
             </div>
          </div>
      );
  }

  const CategoriesView = () => (
      <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto pb-24 animate-[fade-in_0.5s_ease-out]">
          <h1 className="text-3xl font-black italic tracking-tighter text-white mb-2">CHANNELS</h1>
          
          {/* Settings Group */}
          <div className="flex flex-col gap-3 glass-panel p-4 rounded-xl border border-slate-800">
            {/* Difficulty Selector */}
            <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Difficulty</span>
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                    {['Easy', 'Medium', 'Hard', 'Expert'].map(d => (
                        <button 
                            key={d} 
                            onClick={() => setGameState(p => ({...p, settings: {...p.settings, difficulty: d as any}}))}
                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border whitespace-nowrap transition-all flex items-center gap-2
                            ${gameState.settings.difficulty === d ? 'bg-white text-black border-white' : 'bg-transparent text-slate-500 border-slate-800 hover:border-slate-600'}`}
                        >
                            <span>{d}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${gameState.settings.difficulty === d ? 'bg-black/10 text-black' : 'bg-slate-800 text-slate-400'}`}>
                                {POINTS_BY_DIFFICULTY[d]}pts
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Region Selector */}
            <div className="flex flex-col gap-2 mt-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Region Focus</span>
                <div className="flex items-center gap-2">
                    {[
                        { id: 'Global', label: 'Global', icon: <Globe size={14}/> },
                        { id: 'USA', label: 'USA', icon: <span className="text-xs">🇺🇸</span> },
                        { id: 'UK', label: 'UK', icon: <span className="text-xs">🇬🇧</span> },
                    ].map(r => (
                        <button 
                            key={r.id} 
                            onClick={() => setGameState(p => ({...p, settings: {...p.settings, region: r.id as Region}}))}
                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border whitespace-nowrap transition-all flex items-center gap-2
                            ${gameState.settings.region === r.id ? 'bg-cyan-500 text-white border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-transparent text-slate-500 border-slate-800 hover:border-slate-600'}`}
                        >
                            {r.icon}
                            <span>{r.label}</span>
                        </button>
                    ))}
                </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CATEGORIES.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => startNewGame(cat.id)}
                    className="glass-panel p-4 rounded-xl flex flex-col items-start gap-3 hover:bg-white/5 transition-all group text-left h-32 relative overflow-hidden"
                  >
                      <div className={`absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity scale-150 ${cat.color}`}>{cat.icon}</div>
                      <div className={`p-2 rounded-lg bg-black/40 ${cat.color}`}>{cat.icon}</div>
                      <div>
                          <div className="font-bold text-lg leading-none mb-1">{cat.label}</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{cat.description}</div>
                      </div>
                  </button>
              ))}
          </div>
      </div>
  );

  const ProfileView = () => (
      <div className="flex flex-col gap-6 w-full max-w-lg mx-auto pb-24 animate-[fade-in_0.5s_ease-out]">
           <div className="text-center mb-6">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-fuchsia-500 to-cyan-500 rounded-full p-1 mb-4 shadow-xl shadow-fuchsia-500/20">
                    <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                        <User size={40} className="text-white" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-white mb-1">Pop Culture Fan</h1>
                <p className="text-slate-400 text-sm font-mono">Level {stats.level}</p>
           </div>

           {/* XP Bar */}
           <div className="glass-panel p-4 rounded-xl">
               <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                   <span>XP Progress</span>
                   <span>{stats.xp} / {stats.xpToNextLevel}</span>
               </div>
               <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                   <div 
                    className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-500" 
                    style={{ width: `${Math.min(100, (stats.xp / stats.xpToNextLevel) * 100)}%` }}
                   ></div>
               </div>
           </div>

           {/* Stats Grid */}
           <div className="grid grid-cols-2 gap-3">
               <div className="glass-panel p-4 rounded-xl flex flex-col items-center">
                   <Trophy size={20} className="text-yellow-400 mb-2"/>
                   <span className="text-2xl font-black text-white">{stats.gamesWon}</span>
                   <span className="text-[10px] uppercase font-bold text-slate-500">Wins</span>
               </div>
               <div className="glass-panel p-4 rounded-xl flex flex-col items-center">
                   <Zap size={20} className="text-cyan-400 mb-2"/>
                   <span className="text-2xl font-black text-white">{stats.maxStreak}</span>
                   <span className="text-[10px] uppercase font-bold text-slate-500">Max Streak</span>
               </div>
           </div>

           {/* Badges */}
           <div>
               <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Badges</h3>
               <div className="grid grid-cols-4 gap-2">
                   {stats.badges.map(badge => (
                       <div key={badge.id} className={`aspect-square rounded-xl flex items-center justify-center text-2xl border ${badge.unlocked ? 'bg-slate-800 border-white/20' : 'bg-slate-900/50 border-white/5 opacity-30 grayscale'}`}>
                           {badge.icon}
                       </div>
                   ))}
               </div>
           </div>
      </div>
  );

  // --- Main Render ---

  return (
    <div className="min-h-screen flex flex-col relative z-10 px-4 pt-4">
        
        {/* Main Content Area */}
        <div className="flex-1 w-full max-w-5xl mx-auto">
            
            {gameState.view === 'home' && <HomeView />}
            {gameState.view === 'categories' && <CategoriesView />}
            {gameState.view === 'profile' && <ProfileView />}

            {gameState.view === 'game' && (
                <div className="h-full flex flex-col animate-[fade-in_0.3s_ease-out]">
                    {gameState.status === 'generating' ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                             <Loader2 size={48} className="animate-spin text-fuchsia-500 mb-4" />
                             <h2 className="text-2xl font-black text-white mb-2">GENERATING PUZZLE</h2>
                             <p className="text-slate-400 text-sm max-w-xs">Building a {gameState.settings.difficulty} {gameState.settings.region} grid...</p>
                        </div>
                    ) : gameState.status === 'completed' ? (
                         <div className="flex-1 flex flex-col items-center justify-center text-center">
                             <div className="relative mb-8">
                                <div className="absolute inset-0 bg-fuchsia-500 blur-[80px] opacity-40"></div>
                                <Medal size={80} className="relative text-yellow-400 drop-shadow-lg" />
                             </div>
                             <h1 className="text-4xl font-black text-white mb-2 italic">CLEARED!</h1>
                             <div className="text-6xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 mb-8">
                                 {gameState.score}
                             </div>
                             <button 
                                onClick={() => setGameState(p => ({...p, view: 'home', status: 'idle'}))}
                                className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform"
                             >
                                 Continue
                             </button>
                         </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row h-full gap-4 pb-4">
                            {/* Game Header Mobile */}
                            <div className="flex justify-between items-center lg:hidden">
                                <button onClick={() => setGameState(p => ({...p, view: 'home', status: 'idle'}))} className="text-slate-400 hover:text-white"><Home size={20}/></button>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{gameState.puzzle?.theme}</span>
                                <div className="flex items-center gap-3">
                                    {isAutoSaving && <Save size={14} className="text-emerald-500 animate-pulse" />}
                                    <div className="font-mono text-fuchsia-400 text-sm">{Math.floor(gameState.timer/60)}:{(gameState.timer%60).toString().padStart(2,'0')}</div>
                                </div>
                            </div>

                            {/* Board Area */}
                            <div className="flex-1 flex items-center justify-center min-h-[40vh]">
                                <PuzzleGrid grid={gameState.grid} onCellClick={handleCellClick} />
                            </div>

                            {/* Controls Area */}
                            <div className="lg:w-[380px] flex flex-col gap-3 h-full overflow-hidden">
                                {/* Desktop Header */}
                                <div className="hidden lg:flex items-center justify-between px-1 pb-2 border-b border-white/5 mb-2">
                                    <button 
                                        onClick={() => setGameState(p => ({...p, view: 'home', status: 'idle'}))}
                                        className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors hover:bg-white/5 rounded-lg px-2 py-1"
                                    >
                                        <Home size={18} />
                                        <span className="text-xs font-bold uppercase tracking-widest">Home</span>
                                    </button>
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-2">
                                             {isAutoSaving && <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest animate-pulse">Saved</span>}
                                             <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-none mb-1">{gameState.puzzle?.theme}</span>
                                        </div>
                                        <div className="font-mono text-fuchsia-400 text-sm leading-none">
                                            {Math.floor(gameState.timer/60)}:{(gameState.timer%60).toString().padStart(2,'0')}
                                        </div>
                                    </div>
                                </div>

                                {/* Clue Card */}
                                <div className="glass-panel p-4 rounded-xl min-h-[100px] flex flex-col justify-center relative">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] uppercase font-black text-fuchsia-500 tracking-widest">{gameState.direction}</span>
                                        {/* Audio Clue Toggle (Visual Only) */}
                                        <button 
                                            onClick={() => setGameState(p => ({...p, settings: {...p.settings, soundEnabled: !p.settings.soundEnabled}}))}
                                            className="text-slate-600 hover:text-white transition-colors"
                                        >
                                            {gameState.settings.soundEnabled ? <Volume2 size={14}/> : <VolumeX size={14}/>}
                                        </button>
                                    </div>
                                    <div className="text-lg font-medium leading-snug text-white">
                                        {getCurrentClue() ? (
                                            <>
                                                <span className="font-mono text-slate-500 mr-2">{getCurrentClue()?.number}</span>
                                                {getCurrentClue()?.text}
                                            </>
                                        ) : <span className="text-slate-500 italic">Select a cell to start</span>}
                                    </div>
                                    
                                    {/* AI Hint Overlay */}
                                    {aiHint && (
                                        <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm p-4 flex items-center justify-between z-20">
                                            <div className="flex items-center gap-3">
                                                <Sparkles size={16} className="text-cyan-400"/>
                                                <p className="text-sm text-cyan-200 italic">"{aiHint}"</p>
                                            </div>
                                            <button onClick={() => setAiHint(null)} className="p-1 hover:bg-white/10 rounded">✕</button>
                                        </div>
                                    )}
                                </div>

                                {/* Main Controls (Hint, Check, Reveal) */}
                                <div className="flex gap-2">
                                    {showRevealMenu ? (
                                        <>
                                            <button 
                                                onClick={() => handleReveal('cell')}
                                                className="flex-1 bg-yellow-900/40 border border-yellow-500/30 py-3 rounded-lg flex justify-center items-center gap-1 text-yellow-400 text-[10px] font-bold uppercase tracking-wider hover:bg-yellow-900/60"
                                            >
                                                <TypeIcon size={14} /> Letter (-{REVEAL_LETTER_PENALTY})
                                            </button>
                                            <button 
                                                onClick={() => handleReveal('word')}
                                                className="flex-1 bg-yellow-900/40 border border-yellow-500/30 py-3 rounded-lg flex justify-center items-center gap-1 text-yellow-400 text-[10px] font-bold uppercase tracking-wider hover:bg-yellow-900/60"
                                            >
                                                <Hash size={14} /> Word (-{REVEAL_WORD_PENALTY})
                                            </button>
                                            <button onClick={() => setShowRevealMenu(false)} className="px-3 bg-slate-800 rounded-lg text-slate-400">✕</button>
                                        </>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={handleAskAI} 
                                                disabled={isAiThinking}
                                                className="flex-1 bg-cyan-900/20 border border-cyan-500/20 py-3 rounded-lg flex justify-center items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider hover:bg-cyan-900/40"
                                            >
                                                {isAiThinking ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>} Hint
                                            </button>
                                            <button 
                                                onClick={() => setShowRevealMenu(true)}
                                                className="flex-1 bg-yellow-900/20 border border-yellow-500/20 py-3 rounded-lg flex justify-center items-center gap-2 text-yellow-400 text-xs font-bold uppercase tracking-wider hover:bg-yellow-900/40"
                                            >
                                                <EyeIcon size={14}/> Reveal
                                            </button>
                                            <button 
                                                onClick={handleCheckPuzzle}
                                                className="flex-1 bg-slate-800 border border-slate-700 py-3 rounded-lg flex justify-center items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider hover:bg-slate-700 hover:text-white"
                                            >
                                                <Check size={14}/> Check
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div className="mt-auto">
                                    <VirtualKeyboard onKeyPress={handleInput} onDelete={handleBackspace} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Navigation Bar (Only show if not in game or if game is idle/completed) */}
        {gameState.view !== 'game' && <Navbar />}
    </div>
  );
}
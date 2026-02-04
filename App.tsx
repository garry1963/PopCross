import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generatePuzzle } from './services/geminiService';
import { Grid } from './components/Grid';
import { Keyboard } from './components/Keyboard';
import { ClueBar } from './components/ClueBar';
import { CATEGORIES, ICONS } from './constants';
import { PuzzleData, GridCell, Direction, CellPosition, UserStats, ViewState, WordData, Category, Region } from './types';
import { Play, RotateCcw, Award, ArrowLeft, X, Timer, Zap, CheckCircle2, XCircle, Globe, Flame, Save, Trash2 } from 'lucide-react';

export default function App() {
  // --- Global State ---
  const [view, setView] = useState<ViewState>('HOME');
  
  // Load initial stats from local storage or default
  const [userStats, setUserStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('popcross_user_stats');
    return saved ? JSON.parse(saved) : {
      xp: 1250,
      level: 5,
      stars: 320,
      streak: 14,
      completedPuzzles: 42,
      hintsUsed: 0
    };
  });

  // --- Game State ---
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [direction, setDirection] = useState<Direction>(Direction.ACROSS);
  const [loading, setLoading] = useState(false);
  const [solved, setSolved] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // Seconds
  const [isPaused, setIsPaused] = useState(false);
  
  // --- Puzzle Config State ---
  const [puzzleRegion, setPuzzleRegion] = useState<Region>('Mix');
  
  // --- Result State ---
  const [gameResult, setGameResult] = useState<{
    baseXp: number;
    timeBonus: number;
    hintBonus: number;
    totalXp: number;
    starsEarned: number;
    challenges: { label: string; success: boolean; reward: string }[];
  } | null>(null);
  
  // --- UI State ---
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [hasSavedGame, setHasSavedGame] = useState(false);

  // --- Persistence Logic ---

  // 1. Save User Stats whenever they change
  useEffect(() => {
    localStorage.setItem('popcross_user_stats', JSON.stringify(userStats));
  }, [userStats]);

  // 2. Check for saved game on mount
  useEffect(() => {
    const savedGame = localStorage.getItem('popcross_saved_game');
    if (savedGame) {
      setHasSavedGame(true);
    }
  }, []);

  // 3. Auto-save Game State
  useEffect(() => {
    if (view === 'GAME' && puzzle && !solved && !loading) {
      const gameState = {
        puzzle,
        grid,
        elapsedTime,
        hintsUsed: userStats.hintsUsed, // Track session hints
        puzzleRegion,
        timestamp: Date.now()
      };
      localStorage.setItem('popcross_saved_game', JSON.stringify(gameState));
      setHasSavedGame(true);
    } else if (solved) {
      // Clear save on solve
      localStorage.removeItem('popcross_saved_game');
      setHasSavedGame(false);
    }
  }, [grid, puzzle, elapsedTime, solved, view, loading, userStats.hintsUsed, puzzleRegion]);

  // --- Timer Logic ---
  useEffect(() => {
    let interval: any;
    if (view === 'GAME' && !solved && !loading && !isPaused) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [view, solved, loading, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Initialization Helper ---
  const initGrid = (puz: PuzzleData) => {
    // 1. Create Empty Grid
    const newGrid: GridCell[][] = Array.from({ length: puz.height }, (_, r) => 
      Array.from({ length: puz.width }, (_, c) => ({
        row: r,
        col: c,
        value: '',
        correctValue: '',
        isBlack: true,
        clueNumbers: {},
        wordIds: {},
        isLocked: false,
        status: 'empty'
      }))
    );

    // 2. Map Words to Grid
    puz.words.forEach((w, idx) => {
      let r = w.startRow;
      let c = w.startCol;
      const num = idx + 1;

      // Ensure start cell is valid
      if (r < 0 || r >= puz.height || c < 0 || c >= puz.width) return;

      // Mark clue number on start cell
      if (!newGrid[r][c].clueNumbers[w.direction]) {
         newGrid[r][c].clueNumbers[w.direction] = num; // Simplify: Using index+1 as clue num
      }
      
      // Place characters
      for (let i = 0; i < w.answer.length; i++) {
        if (r >= puz.height || c >= puz.width) break;

        newGrid[r][c].isBlack = false;
        newGrid[r][c].correctValue = w.answer[i];
        newGrid[r][c].wordIds[w.direction] = w.id;
        
        if (w.direction === Direction.ACROSS) c++;
        else r++;
      }
    });

    setGrid(newGrid);
    setSolved(false);

    // Select first available cell
    const firstWord = puz.words[0];
    if (firstWord) {
      setSelectedCell({ row: firstWord.startRow, col: firstWord.startCol });
      setDirection(firstWord.direction);
    }
  };

  const startPuzzle = async (category: string, difficulty: 'Easy' | 'Medium' | 'Hard') => {
    // If a saved game exists and we are starting a new one, clear the old save
    if (hasSavedGame) {
        if (!window.confirm("Start new puzzle? Your saved progress will be lost.")) {
            return;
        }
        localStorage.removeItem('popcross_saved_game');
        setHasSavedGame(false);
    }

    setLoading(true);
    setElapsedTime(0);
    setUserStats(prev => ({ ...prev, hintsUsed: 0 })); // Reset hints for this session
    setGameResult(null);

    try {
      const puz = await generatePuzzle(category, difficulty, puzzleRegion);
      if (puz) {
        setPuzzle(puz);
        initGrid(puz);
        setView('GAME');
      }
    } catch (e) {
      console.error("Failed to start puzzle", e);
      alert("Something went wrong generating the puzzle. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resumeGame = () => {
      try {
          const savedData = localStorage.getItem('popcross_saved_game');
          if (!savedData) return;
          
          const state = JSON.parse(savedData);
          setPuzzle(state.puzzle);
          setGrid(state.grid);
          setElapsedTime(state.elapsedTime);
          setPuzzleRegion(state.puzzleRegion || 'Mix');
          
          // Restore session hints without overwriting cumulative stats if possible, 
          // but for now we just track current session hints in userStats
          setUserStats(prev => ({ ...prev, hintsUsed: state.hintsUsed || 0 }));
          
          setSolved(false);
          setGameResult(null);
          setView('GAME');
          
          // Set selection to first available
          if (state.puzzle.words.length > 0) {
              const firstWord = state.puzzle.words[0];
              setSelectedCell({ row: firstWord.startRow, col: firstWord.startCol });
              setDirection(firstWord.direction);
          }
      } catch (e) {
          console.error("Failed to load save", e);
          alert("Could not load saved game.");
          localStorage.removeItem('popcross_saved_game');
          setHasSavedGame(false);
      }
  };

  const discardSavedGame = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm("Discard saved game?")) {
          localStorage.removeItem('popcross_saved_game');
          setHasSavedGame(false);
      }
  };

  // --- Gameplay Logic ---

  const getCurrentWord = (): WordData | undefined => {
    if (!selectedCell || !puzzle) return undefined;
    const cell = grid[selectedCell.row][selectedCell.col];
    const wordId = cell.wordIds[direction];
    return puzzle.words.find(w => w.id === wordId);
  };

  const getNextCell = (r: number, c: number, dir: Direction): CellPosition | null => {
    let nextR = r;
    let nextC = c;
    if (dir === Direction.ACROSS) nextC++;
    else nextR++;

    if (nextR >= grid.length || nextC >= grid[0].length) return null;
    if (grid[nextR][nextC].isBlack) return null; // Stop at black squares (standard mini behavior)
    return { row: nextR, col: nextC };
  };
  
  const getPrevCell = (r: number, c: number, dir: Direction): CellPosition | null => {
      let prevR = r;
      let prevC = c;
      if (dir === Direction.ACROSS) prevC--;
      else prevR--;

      if (prevR < 0 || prevC < 0) return null;
      if (grid[prevR][prevC].isBlack) return null;
      return { row: prevR, col: prevC };
  }

  // Check all words and update cell status to 'correct' if the word is complete
  const updateGridStatus = (currentGrid: GridCell[][]) => {
      if (!puzzle) return;
      
      const correctCells = new Set<string>();

      // 1. Identify all correct words
      puzzle.words.forEach(w => {
          let isWordCorrect = true;
          let r = w.startRow;
          let c = w.startCol;
          const cells: string[] = [];

          for(let i=0; i<w.answer.length; i++) {
              if (currentGrid[r][c].value !== w.answer[i]) {
                  isWordCorrect = false;
              }
              cells.push(`${r},${c}`);
              if (w.direction === Direction.ACROSS) c++;
              else r++;
          }

          if (isWordCorrect) {
              cells.forEach(id => correctCells.add(id));
          }
      });

      // 2. Update grid status
      for (let r = 0; r < currentGrid.length; r++) {
          for (let c = 0; c < currentGrid[0].length; c++) {
              if (currentGrid[r][c].isBlack) continue;

              const isCorrect = correctCells.has(`${r},${c}`);
              
              if (isCorrect) {
                  currentGrid[r][c].status = 'correct';
              } else {
                  if (currentGrid[r][c].status === 'correct' && !currentGrid[r][c].isLocked) {
                      currentGrid[r][c].status = 'editing';
                  }
              }
          }
      }
  };

  const handleKeyPress = useCallback((key: string) => {
    if (!selectedCell || solved) return;

    const { row, col } = selectedCell;
    
    // Deep copy grid to safely mutate
    const newGrid = grid.map(r => r.map(c => ({...c})));
    const cell = newGrid[row][col];

    if (cell.isLocked) {
        // Move to next if locked
        const next = getNextCell(row, col, direction);
        if (next) setSelectedCell(next);
        return;
    }

    // Update value
    cell.value = key;
    // Reset status from incorrect/empty to editing
    if (cell.status === 'incorrect' || cell.status === 'empty') {
        cell.status = 'editing';
    }
    
    // Run global validation for highlighting
    updateGridStatus(newGrid);

    setGrid(newGrid);

    // Check if puzzle is solved
    checkWinCondition(newGrid);

    // Move to next cell automatically
    const next = getNextCell(row, col, direction);
    if (next) setSelectedCell(next);

  }, [grid, selectedCell, direction, solved, puzzle]);

  const handleDelete = useCallback(() => {
    if (!selectedCell || solved) return;
    const { row, col } = selectedCell;
    
    // Deep copy
    const newGrid = grid.map(r => r.map(c => ({...c})));
    
    if (newGrid[row][col].value === '') {
        // Backspace movement
        const prev = getPrevCell(row, col, direction);
        if(prev) {
            setSelectedCell(prev);
            if (!newGrid[prev.row][prev.col].isLocked) {
                newGrid[prev.row][prev.col].value = '';
                newGrid[prev.row][prev.col].status = 'editing';
                updateGridStatus(newGrid); // Re-validate neighbors
                setGrid(newGrid);
            }
        }
    } else {
        if (!newGrid[row][col].isLocked) {
            newGrid[row][col].value = '';
            newGrid[row][col].status = 'empty';
            updateGridStatus(newGrid); // Re-validate neighbors (e.g. un-highlight a broken word)
            setGrid(newGrid);
        }
    }
  }, [grid, selectedCell, direction, solved, puzzle]);

  const handleCellClick = (pos: CellPosition) => {
    if (selectedCell?.row === pos.row && selectedCell?.col === pos.col) {
      // Toggle direction if clicking same cell
      setDirection(prev => prev === Direction.ACROSS ? Direction.DOWN : Direction.ACROSS);
    } else {
      setSelectedCell(pos);
      // Smart direction switching: if new cell only has one word direction, switch to it
      const cell = grid[pos.row][pos.col];
      if (cell.wordIds.across && !cell.wordIds.down) setDirection(Direction.ACROSS);
      else if (!cell.wordIds.across && cell.wordIds.down) setDirection(Direction.DOWN);
    }
  };

  const handleNextClue = () => {
    if (!puzzle || !selectedCell) return;
    const currentWord = getCurrentWord();
    if(!currentWord) return;

    // Find current index
    const idx = puzzle.words.findIndex(w => w.id === currentWord.id);
    const nextIdx = (idx + 1) % puzzle.words.length;
    const nextWord = puzzle.words[nextIdx];

    setSelectedCell({ row: nextWord.startRow, col: nextWord.startCol });
    setDirection(nextWord.direction);
  };
  
  const handlePrevClue = () => {
     if (!puzzle || !selectedCell) return;
    const currentWord = getCurrentWord();
    if(!currentWord) return;

    // Find current index
    const idx = puzzle.words.findIndex(w => w.id === currentWord.id);
    const prevIdx = (idx - 1 + puzzle.words.length) % puzzle.words.length;
    const prevWord = puzzle.words[prevIdx];

    setSelectedCell({ row: prevWord.startRow, col: prevWord.startCol });
    setDirection(prevWord.direction);
  };

  const checkWinCondition = (currentGrid: GridCell[][]) => {
    let isComplete = true;
    let isCorrect = true;

    for (let r = 0; r < currentGrid.length; r++) {
      for (let c = 0; c < currentGrid[0].length; c++) {
        const cell = currentGrid[r][c];
        if (!cell.isBlack) {
          if (cell.value === '') isComplete = false;
          if (cell.value !== cell.correctValue) isCorrect = false;
        }
      }
    }

    if (isComplete && isCorrect) {
      setSolved(true);
      
      // --- Calculate Rewards ---
      const hintsUsed = userStats.hintsUsed;
      const timeTaken = elapsedTime;
      
      const baseXp = 100;
      const isSpeedRun = timeTaken < 180; // 3 minutes
      const timeBonus = isSpeedRun ? 50 : 0;
      
      const isPureGenius = hintsUsed === 0;
      const hintBonus = isPureGenius ? 50 : 0;
      
      const totalXp = baseXp + timeBonus + hintBonus;
      const starsEarned = 25;

      setGameResult({
        baseXp,
        timeBonus,
        hintBonus,
        totalXp,
        starsEarned,
        challenges: [
          { label: "Puzzle Complete", success: true, reward: `+${baseXp} XP` },
          { label: "Speed Demon (< 3m)", success: isSpeedRun, reward: `+${timeBonus} XP` },
          { label: "Pure Genius (0 hints)", success: isPureGenius, reward: `+${hintBonus} XP` }
        ]
      });

      setUserStats(prev => {
        const newXp = prev.xp + totalXp;
        const newLevel = Math.floor(newXp / 1000) + 1; // Simple level curve
        return {
           ...prev,
           xp: newXp,
           level: newLevel,
           stars: prev.stars + starsEarned,
           completedPuzzles: prev.completedPuzzles + 1
        };
      });
      
      // Remove save game on win
      localStorage.removeItem('popcross_saved_game');
      setHasSavedGame(false);
    }
  };
  
  const handleRevealLetter = () => {
      const COST = 10;
      if (userStats.stars < COST || solved || !selectedCell) return;
      
      const { row, col } = selectedCell;
      // Deep copy
      const newGrid = grid.map(r => r.map(c => ({...c})));
      const cell = newGrid[row][col];
      
      if (cell.isLocked || cell.value === cell.correctValue) return; // Don't waste hint
      
      cell.value = cell.correctValue;
      cell.isLocked = true;
      cell.status = 'correct'; // Set to correct for green styling
      
      updateGridStatus(newGrid); // Update highlighting for surrounding words
      setGrid(newGrid);
      setUserStats(prev => ({...prev, stars: prev.stars - COST, hintsUsed: prev.hintsUsed + 1}));
      checkWinCondition(newGrid);
  };

  const handleRevealWord = () => {
      const COST = 25;
      if (userStats.stars < COST || solved || !selectedCell) return;
      
      const currentWord = getCurrentWord();
      if (!currentWord) return;

      const newGrid = grid.map(r => r.map(c => ({...c})));
      let r = currentWord.startRow;
      let c = currentWord.startCol;
      let revealedCount = 0;

      for (let i = 0; i < currentWord.answer.length; i++) {
          const cell = newGrid[r][c];
          if (!cell.isLocked && cell.value !== cell.correctValue) {
             cell.value = cell.correctValue;
             cell.isLocked = true;
             cell.status = 'correct'; // Set to correct for green styling
             revealedCount++;
          }
          if (currentWord.direction === Direction.ACROSS) c++;
          else r++;
      }

      if (revealedCount > 0) {
          updateGridStatus(newGrid); // Update highlighting
          setGrid(newGrid);
          setUserStats(prev => ({...prev, stars: prev.stars - COST, hintsUsed: prev.hintsUsed + 1}));
          checkWinCondition(newGrid);
      }
  };

  const handleCheckPuzzle = () => {
      if (solved) return;
      
      const newGrid = grid.map(row => row.map(cell => {
          if (cell.isBlack) return {...cell};
          if (cell.value !== '' && cell.value !== cell.correctValue) {
              return { ...cell, status: 'incorrect' };
          }
          if (cell.value === cell.correctValue && !cell.isLocked) {
              return { ...cell, status: 'correct' }; // Visual positive feedback
          }
          return {...cell};
      }));
      setGrid(newGrid);
  };

  // Keyboard Listeners for Desktop
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
        if (view !== 'GAME') return;
        if (e.key === 'Backspace') handleDelete();
        else if (e.key === 'Enter') handleNextClue(); // Or Tab
        else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) handleKeyPress(e.key.toUpperCase());
        else if (e.key === 'ArrowUp') { setSelectedCell(prev => prev ? getPrevCell(prev.row, prev.col, Direction.DOWN) || prev : prev); setDirection(Direction.DOWN); }
        else if (e.key === 'ArrowDown') { setSelectedCell(prev => prev ? getNextCell(prev.row, prev.col, Direction.DOWN) || prev : prev); setDirection(Direction.DOWN); }
        else if (e.key === 'ArrowLeft') { setSelectedCell(prev => prev ? getPrevCell(prev.row, prev.col, Direction.ACROSS) || prev : prev); setDirection(Direction.ACROSS); }
        else if (e.key === 'ArrowRight') { setSelectedCell(prev => prev ? getNextCell(prev.row, prev.col, Direction.ACROSS) || prev : prev); setDirection(Direction.ACROSS); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [view, handleDelete, handleKeyPress, grid, selectedCell]);


  // --- Ambient Background Component ---
  const AmbientBackground = () => (
    <div className="absolute inset-0 overflow-hidden -z-10 bg-dark-950 bg-grid-pattern bg-[length:40px_40px]">
       {/* Gradient Blobs */}
       <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-neon-purple/20 rounded-full blur-[100px] animate-float"></div>
       <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-neon-cyan/10 rounded-full blur-[120px] animate-float" style={{animationDelay: '2s'}}></div>
       <div className="absolute top-[30%] left-[40%] w-[300px] h-[300px] bg-neon-pink/10 rounded-full blur-[80px] animate-float" style={{animationDelay: '5s'}}></div>
    </div>
  );

  // --- Views ---

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-dark-950 text-neon-cyan gap-6 relative overflow-hidden">
        <AmbientBackground />
        <div className="relative">
          <div className="w-20 h-20 border-4 border-t-neon-purple border-b-neon-cyan border-l-transparent border-r-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-neon-cyan/20 rounded-full blur-md animate-pulse"></div>
          </div>
        </div>
        <p className="font-mono text-lg animate-pulse tracking-widest text-glow">GENERATING PUZZLE...</p>
      </div>
    );
  }

  if (view === 'HOME') {
    return (
      <div className="h-screen text-white flex flex-col relative overflow-hidden">
        <AmbientBackground />
        
        {/* Header */}
        <header className="p-5 flex justify-between items-center border-b border-white/5 bg-dark-950/60 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-neon-purple to-neon-cyan rounded-xl flex items-center justify-center font-black text-black text-xl shadow-[0_0_15px_rgba(114,9,183,0.5)] transform hover:rotate-6 transition-transform">P</div>
            <div>
              <h1 className="text-2xl font-bold font-sans tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">POPCROSS</h1>
              <p className="text-[10px] font-mono text-neon-cyan uppercase tracking-widest leading-none">Infinite Culture Puzzles</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5 text-neon-yellow font-mono text-sm bg-dark-800/80 px-3 py-1.5 rounded-full border border-neon-yellow/20 shadow-[0_0_10px_rgba(255,214,10,0.2)]">
               {ICONS.Star} {userStats.stars}
             </div>
             <div className="w-10 h-10 rounded-full bg-dark-800 border-2 border-dark-700 overflow-hidden hover:border-neon-purple transition-colors">
                <img src="https://picsum.photos/100/100" alt="Avatar" className="w-full h-full object-cover" />
             </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto pb-24 max-w-4xl mx-auto w-full z-10 custom-scrollbar">
          
          {/* Resume Game Card (Conditionally Rendered) */}
          {hasSavedGame && (
             <section className="mb-8 relative group cursor-pointer animate-in slide-in-from-top-4 duration-500" onClick={resumeGame}>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <div className="relative bg-dark-900/90 backdrop-blur-xl border border-orange-500/30 rounded-3xl p-6 flex justify-between items-center overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-orange-500/10 to-transparent"></div>
                    <div>
                         <div className="flex items-center gap-2 mb-2 text-orange-400">
                            <RotateCcw className="w-4 h-4 animate-spin-slow" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Unfinished Business</span>
                         </div>
                         <h2 className="text-2xl font-bold text-white mb-1">Resume Last Game</h2>
                         <p className="text-gray-400 text-xs">Pick up exactly where you left off.</p>
                    </div>
                    <div className="flex items-center gap-3 relative z-10">
                        <button 
                            onClick={discardSavedGame} 
                            className="p-3 rounded-xl hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors"
                            title="Discard Save"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <button className="bg-orange-500 text-white p-4 rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.4)] group-hover:scale-105 transition-transform">
                            <Play className="w-5 h-5 fill-white" />
                        </button>
                    </div>
                </div>
             </section>
          )}

          {/* Daily Challenge Card */}
          <section className="mb-10 relative group cursor-pointer" onClick={() => startPuzzle('Daily Mix', 'Medium')}>
            <div className="absolute inset-0 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-yellow rounded-3xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
            <div className="relative bg-dark-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 overflow-hidden">
               {/* Decorative background stripes */}
               <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-neon-purple/10 to-transparent skew-x-12"></div>

               <div className="flex justify-between items-start relative z-10">
                 <div>
                   <div className="flex items-center gap-2 mb-2">
                     <span className="text-[10px] font-bold bg-gradient-to-r from-neon-purple to-neon-pink text-white px-2 py-0.5 rounded uppercase tracking-wider">Daily Drop</span>
                     <span className="text-[10px] font-mono text-neon-cyan animate-pulse">LIVE NOW</span>
                   </div>
                   <h2 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-white drop-shadow-lg">CULTURE <br/>VULTURE</h2>
                   <p className="text-gray-300 text-sm mt-3 max-w-xs font-light">Today's curated mix of trending topics, viral memes, and chart-toppers.</p>
                 </div>
                 <div className="hidden sm:block">
                   <Flame className="w-16 h-16 text-neon-pink animate-pulse-fast drop-shadow-[0_0_10px_rgba(247,37,133,0.5)]" />
                 </div>
               </div>
               
               <button className="relative z-10 w-full sm:w-auto bg-white text-black font-black py-4 px-8 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                 <Play className="w-5 h-5 fill-black" /> PLAY NOW
               </button>
            </div>
          </section>

          {/* Stats Teaser */}
          <section className="mb-10 grid grid-cols-2 gap-4">
             <div className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center text-center group hover:bg-white/5 transition-colors">
               <h4 className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-1">Current Streak</h4>
               <p className="text-neon-cyan font-black text-3xl group-hover:scale-110 transition-transform">{userStats.streak} <span className="text-lg">Days</span></p>
             </div>
             <div className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center text-center group hover:bg-white/5 transition-colors">
               <h4 className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-1">XP Level</h4>
               <p className="text-neon-purple font-black text-3xl group-hover:scale-110 transition-transform">{userStats.level}</p>
             </div>
          </section>

          {/* Categories Grid */}
          <section>
            <div className="flex items-center gap-3 mb-6">
               <div className="p-2 bg-dark-800 rounded-lg text-neon-green">{ICONS.Grid}</div>
               <h3 className="text-xl font-bold tracking-tight">Browse Categories</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {CATEGORIES.map(cat => (
                <div 
                  key={cat.id} 
                  onClick={() => setSelectedCategory(cat)}
                  className={`glass-card p-5 rounded-2xl cursor-pointer group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden`}
                >
                   {/* Hover Gradient Background */}
                   <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-${cat.color.split(' ')[0].replace('text-', '')}/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                   
                   <div className={`${cat.color} mb-4 p-3 bg-dark-900/50 rounded-xl w-fit group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(0,0,0,0.5)]`}>
                      {cat.icon}
                   </div>
                   <h4 className="font-bold text-lg leading-none mb-1 group-hover:text-white transition-colors">{cat.name}</h4>
                   <p className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">{cat.description}</p>
                </div>
              ))}
            </div>
          </section>

        </main>
        
        {/* Difficulty & Region Selection Modal */}
        {selectedCategory && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xl flex items-center justify-center p-4">
                <div className="bg-dark-900 border border-white/10 rounded-3xl w-full max-w-sm p-8 relative shadow-[0_0_100px_rgba(114,9,183,0.3)] animate-in fade-in zoom-in duration-300 overflow-hidden">
                    {/* Background blob */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-neon-purple/20 rounded-full blur-[60px] pointer-events-none"></div>

                    <button 
                        onClick={() => setSelectedCategory(null)} 
                        className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors bg-dark-800 p-2 rounded-full hover:bg-dark-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    
                    <div className="mb-8 relative z-10">
                        <div className={`inline-block p-3 rounded-2xl bg-dark-800 mb-4 ${selectedCategory.color} shadow-lg`}>
                            {selectedCategory.icon}
                        </div>
                        <h3 className="text-3xl font-black text-white leading-none tracking-tight">{selectedCategory.name}</h3>
                        <p className="text-gray-400 text-sm mt-2 font-light">Customize your game setup.</p>
                    </div>

                    {/* Region Selector */}
                    <div className="mb-6">
                        <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-3 block pl-1">Region Preference</span>
                        <div className="flex bg-dark-950 p-1.5 gap-2 rounded-xl border border-white/5">
                            {(['USA', 'UK', 'Mix'] as Region[]).map(r => (
                                <button
                                    key={r}
                                    onClick={() => setPuzzleRegion(r)}
                                    className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                        puzzleRegion === r 
                                        ? 'bg-dark-800 text-white shadow-lg border border-white/10' 
                                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                    }`}
                                >
                                    {r === 'Mix' ? <Globe className="w-3.5 h-3.5" /> : (r === 'USA' ? '🇺🇸' : '🇬🇧')} {r === 'Mix' ? 'Global' : r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1 pl-1">Select Difficulty</span>
                        
                        {[
                          { id: 'Easy', color: 'neon-cyan', desc: '3-6 letters', sub: 'Popular & Simple' },
                          { id: 'Medium', color: 'neon-yellow', desc: '4-9 letters', sub: 'Fan Favorites' },
                          { id: 'Hard', color: 'neon-pink', desc: '5-12 letters', sub: 'Deep Cuts' }
                        ].map((level) => (
                           <button 
                            key={level.id}
                            onClick={() => { startPuzzle(selectedCategory.name, level.id as any); setSelectedCategory(null); }}
                            className={`group relative overflow-hidden bg-dark-800 hover:bg-dark-700 border border-white/5 hover:border-${level.color}/50 p-4 rounded-xl text-left transition-all duration-300`}
                        >
                            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${level.color} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                            <div className="flex justify-between items-center mb-1 pl-2">
                                <span className={`font-bold text-white text-lg group-hover:text-${level.color} transition-colors`}>{level.id}</span>
                                <span className="text-[10px] bg-dark-950 px-2 py-1 rounded text-gray-400 font-mono border border-white/5">{level.desc}</span>
                            </div>
                            <div className="text-xs text-gray-500 pl-2">{level.sub}</div>
                        </button>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  if (view === 'GAME' && puzzle) {
    const currentWord = getCurrentWord();
    const currentWordIndex = puzzle.words.findIndex(w => w.id === currentWord?.id);

    return (
      <div className="h-screen bg-dark-950 text-white flex flex-col relative overflow-hidden">
        <AmbientBackground />
        
        {/* Game Header */}
        <div className="flex justify-between items-center px-4 py-3 bg-dark-900/80 backdrop-blur-md border-b border-white/5 z-20 shrink-0">
           <button onClick={() => setView('HOME')} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
             <ArrowLeft className="w-5 h-5" />
           </button>
           
           <div className="flex flex-col items-center">
             <div className="flex items-center gap-2 text-neon-cyan font-mono text-sm font-bold bg-dark-950/50 px-3 py-1 rounded-full border border-neon-cyan/20 shadow-[0_0_10px_rgba(76,201,240,0.2)]">
                <Timer className="w-4 h-4" /> {formatTime(elapsedTime)}
             </div>
             <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-semibold">{puzzle.difficulty} • {puzzleRegion === 'Mix' ? 'Global' : puzzleRegion}</div>
           </div>

           <div className="flex items-center gap-2">
                {/* Visual Indicator that game is saved */}
                <div className="p-2 rounded-full bg-dark-950/50 border border-white/5 text-neon-green/50" title="Progress Saved">
                    <Save className="w-4 h-4" />
                </div>
                <button className="flex items-center gap-1 text-neon-yellow font-bold text-sm bg-dark-950/50 px-3 py-1.5 rounded-full border border-neon-yellow/20">
                    {ICONS.Star} {userStats.stars}
                </button>
           </div>
        </div>

        {/* Responsive Content Container */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-10">
            
            {/* Grid Area - Centered and fills available space */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 relative no-scrollbar">
                <Grid 
                    grid={grid} 
                    width={puzzle.width} 
                    height={puzzle.height} 
                    selectedCell={selectedCell}
                    selectedDirection={direction}
                    onCellClick={handleCellClick}
                />
            </div>

            {/* Controls Area (Clue + Keyboard) */}
            {/* Mobile: Bottom Sheet, Tablet/Desktop: Right Sidebar */}
            <div className="shrink-0 z-20 w-full lg:w-[420px] bg-dark-950/80 backdrop-blur-xl border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col justify-end lg:justify-center pb-safe">
                <div className="lg:mb-auto"></div> {/* Spacer for desktop vertical centering */}
                
                <ClueBar 
                    clue={currentWord?.clue || ""} 
                    direction={currentWord?.direction || Direction.ACROSS} 
                    clueNumber={currentWordIndex + 1}
                    onNext={handleNextClue}
                    onPrev={handlePrevClue}
                />
                
                <Keyboard 
                    onKeyPress={handleKeyPress} 
                    onDelete={handleDelete}
                    onEnter={handleNextClue}
                    onRevealLetter={handleRevealLetter}
                    onRevealWord={handleRevealWord}
                    onCheck={handleCheckPuzzle}
                    userStars={userStats.stars}
                />
                
                <div className="lg:mb-auto"></div> {/* Spacer for desktop vertical centering */}
            </div>
        </div>

        {/* Win Modal Overlay */}
        {solved && gameResult && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-dark-900 border border-neon-green/30 rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_0_80px_rgba(0,245,212,0.15)] flex flex-col animate-in zoom-in duration-300 relative">
               
               {/* Confetti effect placeholder or gradient glow */}
               <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-neon-green/20 to-transparent pointer-events-none"></div>

               {/* Modal Header */}
               <div className="p-8 text-center relative z-10">
                   <div className="w-20 h-20 bg-gradient-to-br from-neon-green to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(0,245,212,0.4)] animate-bounce">
                        <Award className="w-10 h-10 text-black" />
                   </div>
                   <h2 className="text-3xl font-black text-white uppercase tracking-wider italic transform -skew-x-6">Mission<br/>Complete</h2>
                   <p className="text-gray-400 text-sm mt-2 font-mono">{puzzle.theme}</p>
               </div>

               {/* Challenges List */}
               <div className="px-8 pb-4 space-y-3">
                    {gameResult.challenges.map((challenge, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-dark-950/50 border border-white/5">
                            <div className="flex items-center gap-3">
                                {challenge.success ? (
                                    <CheckCircle2 className="w-5 h-5 text-neon-green" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-gray-700" />
                                )}
                                <span className={`text-sm font-semibold ${challenge.success ? 'text-white' : 'text-gray-500'}`}>
                                    {challenge.label}
                                </span>
                            </div>
                            <span className={`text-xs font-mono font-bold ${challenge.success ? 'text-neon-cyan' : 'text-gray-700'}`}>
                                {challenge.success ? challenge.reward : '---'}
                            </span>
                        </div>
                    ))}
               </div>

               {/* Level Progress */}
               <div className="px-8 py-4 bg-dark-950/30">
                    <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                        <span>Lvl {userStats.level}</span>
                        <span>{Math.floor((userStats.xp % 1000) / 10)}%</span>
                    </div>
                    <div className="h-3 bg-dark-800 rounded-full overflow-hidden border border-white/5">
                        <div 
                            className="h-full bg-gradient-to-r from-neon-purple to-neon-cyan shadow-[0_0_10px_rgba(114,9,183,0.8)]"
                            style={{ width: `${(userStats.xp % 1000) / 10}%` }}
                        ></div>
                    </div>
                    <div className="text-center mt-2 text-[10px] text-gray-600 font-mono">
                        {1000 - (userStats.xp % 1000)} XP to next level
                    </div>
               </div>

               {/* Actions */}
               <div className="p-6 flex gap-3 bg-dark-900 border-t border-white/5">
                    <button onClick={() => setView('HOME')} className="flex-1 py-4 rounded-xl bg-dark-800 text-gray-300 font-bold text-sm hover:bg-dark-700 hover:text-white transition-colors border border-white/5">
                        Menu
                    </button>
                    <button onClick={() => startPuzzle(puzzle.theme, 'Hard')} className="flex-1 py-4 rounded-xl bg-white text-black font-black text-sm hover:bg-neon-cyan transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                        <RotateCcw className="w-4 h-4" /> Next Level
                    </button>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
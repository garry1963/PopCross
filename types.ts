export type Direction = 'across' | 'down';

export interface Clue {
  number: number;
  direction: Direction;
  text: string;
  answer: string;
  row: number;
  col: number;
  type?: 'text' | 'audio' | 'emoji'; // For future expansion
}

export interface CellData {
  row: number;
  col: number;
  value: string; // The correct letter
  userValue: string; // The user's input
  isBlack: boolean; // True if this is a void/block
  number: number | null; // The clue number if this is the start of a word
  active: boolean; // Is currently selected
  related: boolean; // Is part of the active word
  isCorrect: boolean; // Internal check for win condition
  isRevealed: boolean; // Was this revealed by a tool?
  isError?: boolean; // Is marked as incorrect
  isWordComplete?: boolean; // Is part of a fully completed and correct word
}

export interface PuzzleData {
  title: string;
  theme: string;
  gridSize: number;
  grid: string[][]; // The solution grid
  clues: Clue[];
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';
export type Region = 'Global' | 'USA' | 'UK';

export interface GameSettings {
  difficulty: Difficulty;
  region: Region;
  soundEnabled: boolean;
  hapticEnabled: boolean;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
}

export interface UserStats {
  totalPoints: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  lastDailyDate: string | null;
  badges: Badge[];
}

export interface GameState {
  view: 'home' | 'categories' | 'profile' | 'game';
  status: 'idle' | 'generating' | 'playing' | 'completed';
  puzzle: PuzzleData | null;
  grid: CellData[][];
  selectedCell: { row: number; col: number } | null;
  direction: Direction;
  timer: number;
  hintsUsed: number;
  revealsUsed: number;
  score: number;
  isDaily: boolean;
  settings: GameSettings;
}

export type TopicId = 
  | 'General' | 'General Knowledge'
  | 'Movies' | 'TV Shows' | 'Music' 
  | '90s' | '2000s' | 'Modern' 
  | 'Horror' | 'Sci-Fi' | 'Comedy' 
  | 'Hip-Hop' | 'Rock' | 'Pop Divas' 
  | 'Superheroes' | 'Reality TV' | 'Anime';

export interface Category {
    id: TopicId;
    label: string;
    icon: any; // Lucide icon component
    color: string;
    description: string;
}
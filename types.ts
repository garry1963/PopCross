
import React, { ReactNode } from 'react';

export enum Direction {
  ACROSS = 'across',
  DOWN = 'down',
}

export interface CellPosition {
  row: number;
  col: number;
}

export interface WordData {
  id: string;
  word: string;
  clue: string;
  startRow: number;
  startCol: number;
  direction: Direction;
  answer: string; // The correct answer
}

export interface GridCell {
  row: number;
  col: number;
  value: string; // User input
  correctValue: string; // Actual answer
  isBlack: boolean;
  clueNumbers: { [key in Direction]?: number }; // If this cell starts a word
  wordIds: { [key in Direction]?: string }; // IDs of words this cell belongs to
  isLocked: boolean; // For revealed hints
  status: 'empty' | 'correct' | 'incorrect' | 'editing' | 'locked';
}

export interface PuzzleData {
  id: string;
  title: string;
  theme: string;
  width: number;
  height: number;
  words: WordData[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isDaily?: boolean;
}

export interface UserStats {
  xp: number;
  level: number;
  stars: number;
  streak: number;
  completedPuzzles: number;
  hintsUsed: number;
  lastDailyComplete?: number; // Timestamp
}

export type ViewState = 'HOME' | 'GAME' | 'CATEGORY_SELECT' | 'PROFILE';

export interface Category {
  id: string;
  name: string;
  icon: ReactNode;
  description: string;
  color: string;
}

export type Region = 'USA' | 'UK' | 'Mix';

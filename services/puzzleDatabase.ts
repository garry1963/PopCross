
import { Region } from "../types";
import { SEED_DATA, SeedEntry } from "./seedData";

// --- History of Used Words (Persisted) ---
export interface PuzzleHistory {
  [category: string]: string[]; // Array of used uppercase answers
}

const HISTORY_KEY = 'popcross_puzzle_history_v1';
const CONTENT_DB_KEY = 'popcross_content_db_v1';

// --- Content Database Types ---
export interface ContentEntry extends SeedEntry {
    // Extends SeedEntry: category, word, clue, difficulty, regions
}

// --- HISTORY FUNCTIONS ---

const loadHistory = (): PuzzleHistory => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Failed to load puzzle history", e);
    return {};
  }
};

const saveHistory = (db: PuzzleHistory) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(db));
  } catch (e) {
    console.error("Failed to save puzzle history", e);
  }
};

export const getUsedWords = (category: string): string[] => {
  const db = loadHistory();
  return db[category] || [];
};

export const addWordsToHistory = (category: string, words: string[]) => {
  const db = loadHistory();
  if (!db[category]) db[category] = [];
  
  // Add new words, ensuring no duplicates in the store
  const uniqueSet = new Set(db[category]);
  words.forEach(w => uniqueSet.add(w.toUpperCase()));
  
  db[category] = Array.from(uniqueSet);
  saveHistory(db);
};

export const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
};

// --- CONTENT DATABASE FUNCTIONS ---

const loadContentDB = (): ContentEntry[] => {
    try {
        const raw = localStorage.getItem(CONTENT_DB_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
};

const saveContentDB = (data: ContentEntry[]) => {
    localStorage.setItem(CONTENT_DB_KEY, JSON.stringify(data));
};

export const initializeDatabase = () => {
    const existing = loadContentDB();
    if (existing.length === 0) {
        console.log("Initializing Content Database with Seed Data...");
        saveContentDB(SEED_DATA);
    }
};

export const getWordsForPuzzle = (
    category: string, 
    region: Region, 
    difficulty: 'Easy' | 'Medium' | 'Hard'
): { word: string; clue: string }[] => {
    const allContent = loadContentDB();
    
    // Map difficulty string to number range
    // Easy: 1, Medium: 1-2, Hard: 2-3
    const allowedDiffs = difficulty === 'Easy' ? [1] : (difficulty === 'Medium' ? [1, 2] : [2, 3]);

    // Filter Logic
    const candidates = allContent.filter(entry => {
        // 1. Category Match
        if (entry.category !== category) return false;
        
        // 2. Region Match (Entry must include the requested region OR be Universal 'Mix')
        // If region is 'Mix', we accept everything. If specific, we look for specific or Mix.
        const regionMatch = region === 'Mix' 
            ? true 
            : (entry.regions.includes(region) || entry.regions.includes('Mix'));
        
        if (!regionMatch) return false;

        // 3. Difficulty Match
        if (!allowedDiffs.includes(entry.difficulty)) return false;

        return true;
    });

    // Shuffle
    return candidates.sort(() => Math.random() - 0.5).map(c => ({ word: c.word, clue: c.clue }));
};

// Allow API to add new words to our local DB for future use
export const saveNewWordsToDB = (category: string, words: {word: string, clue: string}[]) => {
    const currentDB = loadContentDB();
    const newEntries: ContentEntry[] = words.map(w => ({
        category,
        word: w.word,
        clue: w.clue,
        difficulty: w.word.length > 6 ? 2 : 1, // Heuristic
        regions: ['Mix'] // Assume universal if from API
    }));
    
    // Avoid duplicates
    const existingSet = new Set(currentDB.map(e => e.word + e.category));
    const uniqueNew = newEntries.filter(e => !existingSet.has(e.word + e.category));
    
    if (uniqueNew.length > 0) {
        saveContentDB([...currentDB, ...uniqueNew]);
    }
};

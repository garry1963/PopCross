import { PuzzleData, GameState } from '../types';

const DAILY_KEY = 'popcross_db_daily';
const WORD_BANK_PREFIX = 'popcross_words_';

export interface DailyCache {
    date: string;
    puzzle: PuzzleData;
}

export interface WordItem {
    answer: string;
    clue: string;
}

// --- Word Bank Database ---

export const getWordBank = (topic: string, difficulty: string): WordItem[] => {
    try {
        const key = `${WORD_BANK_PREFIX}${topic}_${difficulty}`;
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("WordBank Read Error", e);
        return [];
    }
};

export const saveToWordBank = (topic: string, difficulty: string, newWords: WordItem[]) => {
    try {
        const key = `${WORD_BANK_PREFIX}${topic}_${difficulty}`;
        const existing = getWordBank(topic, difficulty);
        
        // Merge and Deduplicate
        const map = new Map<string, WordItem>();
        existing.forEach(w => map.set(w.answer, w));
        newWords.forEach(w => map.set(w.answer, w));
        
        const merged = Array.from(map.values());
        
        // Limit size to prevent localStorage overflow (keep last 200 words per topic)
        const trimmed = merged.slice(0, 200);
        
        localStorage.setItem(key, JSON.stringify(trimmed));
    } catch (e) {
        console.error("WordBank Write Error", e);
    }
};

// --- Daily Puzzle Database ---

export const getDailyPuzzleFromDb = (): PuzzleData | null => {
    try {
        const stored = localStorage.getItem(DAILY_KEY);
        if (!stored) return null;
        
        const parsed: DailyCache = JSON.parse(stored);
        const today = new Date().toISOString().split('T')[0];
        
        // Return only if it matches today's date
        if (parsed.date === today) {
            return parsed.puzzle;
        }
        
        // Expire old cache
        localStorage.removeItem(DAILY_KEY);
        return null;
    } catch (e) {
        console.error("DB Read Error", e);
        return null;
    }
};

export const saveDailyPuzzleToDb = (puzzle: PuzzleData) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const cache: DailyCache = { date: today, puzzle };
        localStorage.setItem(DAILY_KEY, JSON.stringify(cache));
    } catch (e) {
        console.error("DB Write Error", e);
    }
};

// --- General Persistence ---

export const saveGameState = (state: GameState) => {
    localStorage.setItem('popcross_save_v2', JSON.stringify(state));
};

export const loadGameState = (): GameState | null => {
    const saved = localStorage.getItem('popcross_save_v2');
    return saved ? JSON.parse(saved) : null;
};

export const clearGameState = () => {
    localStorage.removeItem('popcross_save_v2');
};

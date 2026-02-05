import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PuzzleData, Clue, Difficulty, Region } from "../types";
import { getWordBank, saveToWordBank, WordItem } from "./storageService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Configuration
// gemini-3-flash-preview is optimized for speed and instruction following
const MODEL_ID = "gemini-3-flash-preview"; 

interface DifficultyProfile {
    gridSize: number;
    minWords: number;      // Minimum required to accept the puzzle
    targetWords: number;   // Stop generation if we hit this
    fetchCount: number;    // How many candidates to ask AI for
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyProfile> = {
    'Easy':   { gridSize: 9,  minWords: 6,  targetWords: 10, fetchCount: 30 },
    'Medium': { gridSize: 11, minWords: 10, targetWords: 15, fetchCount: 40 },
    'Hard':   { gridSize: 13, minWords: 15, targetWords: 20, fetchCount: 50 },
    'Expert': { gridSize: 15, minWords: 20, targetWords: 25, fetchCount: 60 },
};

// 1. Fetch Word List
const fetchWordList = async (topic: string, difficulty: Difficulty, region: Region): Promise<WordItem[]> => {
    const config = DIFFICULTY_CONFIG[difficulty];
    
    // A. Check Local Word Bank First
    const cachedWords = getWordBank(topic, difficulty);
    
    // Check if we have enough cached words to satisfy the fetchCount (or at least a good chunk of it)
    // We want a fresh mix, but if we have plenty, we skip AI.
    if (cachedWords.length >= config.fetchCount) {
        console.log(`Using Cached Words for ${difficulty} (${cachedWords.length} avail)`);
        // Shuffle array
        return cachedWords.sort(() => 0.5 - Math.random()); 
    }

    // B. If not enough cached, call AI
    console.log(`Fetching ${config.fetchCount} new words from AI for ${difficulty}...`);
    const prompt = `
      Generate a list of ${config.fetchCount} crossword answers and clues for the topic "${topic}" (${region} context).
      Difficulty: ${difficulty}.
      
      Rules:
      - Answers must be single words (no spaces) or common phrases with spaces removed.
      - Uppercase only.
      - Minimum length 3, Maximum length ${config.gridSize}.
      - No special characters.
      - Ensure a mix of word lengths (short words are important for connecting).
      
      Output JSON format:
      [ { "answer": "WORD", "clue": "Hint" }, ... ]
    `;

    const schema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                answer: { type: Type.STRING },
                clue: { type: Type.STRING }
            },
            required: ["answer", "clue"]
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: MODEL_ID,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.8 // High creativity for variety
            }
        });
        
        let cleanText = response.text || "[]";
        cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();

        const data = JSON.parse(cleanText);
        
        if (!Array.isArray(data)) return [];

        // Strict sanitization
        const validWords = data
            .filter(i => i.answer && i.clue)
            .map(i => ({
                answer: i.answer.trim().toUpperCase().replace(/[^A-Z]/g, ''), // Remove non-alpha
                clue: i.clue.trim()
            }))
            .filter(i => i.answer.length >= 3 && i.answer.length <= config.gridSize);
            
        // Save to Word Bank for next time
        if (validWords.length > 0) {
            saveToWordBank(topic, difficulty, validWords);
        }

        return validWords;

    } catch (e) {
        console.error("AI Fetch Error", e);
        // Fallback to cache if AI fails, even if small
        return cachedWords.length > 0 ? cachedWords : [];
    }
};

// 2. Local Layout Algorithm
// A greedy backtracking-lite approach to place words on a grid
const generateLayout = (wordList: WordItem[], size: number): PuzzleData | null => {
    if (wordList.length === 0) return null;

    // Grid Initialization: '.' is empty/black, char is filled
    let grid: string[][] = Array(size).fill(null).map(() => Array(size).fill('.'));
    const clues: Clue[] = [];
    
    // Helper to check bounds
    const inBounds = (r: number, c: number) => r >= 0 && r < size && c >= 0 && c < size;

    // Helper to check if a placement is valid
    const canPlace = (word: string, r: number, c: number, dir: 'across' | 'down'): boolean => {
        const len = word.length;
        
        // 0. Safety Checks
        if (r < 0 || c < 0) return false;

        // 1. Basic Bounds
        if (dir === 'across') {
            if (c + len > size) return false;
            // Check ends are clear (must be black or boundary) to avoid extending words improperly
            if (inBounds(r, c - 1) && grid[r][c - 1] !== '.') return false;
            if (inBounds(r, c + len) && grid[r][c + len] !== '.') return false;
        } else {
            if (r + len > size) return false;
            if (inBounds(r - 1, c) && grid[r - 1][c] !== '.') return false;
            if (inBounds(r + len, c) && grid[r + len][c] !== '.') return false;
        }

        // 2. Cell interactions
        for (let i = 0; i < len; i++) {
            const curR = dir === 'across' ? r : r + i;
            const curC = dir === 'across' ? c + i : c;
            
            // Double check bounds for safety, though 'Basic Bounds' should cover it
            if (!inBounds(curR, curC)) return false;

            const char = word[i];
            const gridChar = grid[curR][curC];

            // Collision check: Cell must be empty OR match the letter
            if (gridChar !== '.' && gridChar !== char) return false;

            // Adjacency check (Crucial for validity):
            // If we are placing content into an EMPTY cell, we must ensure it doesn't accidentally
            // touch other words on its parallel sides, creating 2-letter nonsense words.
            if (gridChar === '.') {
                if (dir === 'across') {
                   // Check Top/Bottom neighbors
                   if (inBounds(curR - 1, curC) && grid[curR - 1][curC] !== '.') return false;
                   if (inBounds(curR + 1, curC) && grid[curR + 1][curC] !== '.') return false;
                } else {
                   // Check Left/Right neighbors
                   if (inBounds(curR, curC - 1) && grid[curR][curC - 1] !== '.') return false;
                   if (inBounds(curR, curC + 1) && grid[curR][curC + 1] !== '.') return false;
                }
            }
        }
        return true;
    };

    // Helper to commit word
    const place = (item: WordItem, r: number, c: number, dir: 'across' | 'down') => {
        for (let i = 0; i < item.answer.length; i++) {
            const curR = dir === 'across' ? r : r + i;
            const curC = dir === 'across' ? c + i : c;
            grid[curR][curC] = item.answer[i];
        }
        clues.push({
            number: 0, // Assigned later
            direction: dir,
            text: item.clue,
            answer: item.answer,
            row: r,
            col: c
        });
    };

    // --- Execution ---
    
    // NOTE: We do NOT sort here anymore. We trust the input order.
    // This allows the caller to try heuristic sort vs random shuffle.
    const workingList = [...wordList]; 
    const placedWords: WordItem[] = [];

    // Place first word centered horizontally
    const first = workingList[0];
    const startR = Math.floor(size / 2);
    const startC = Math.max(0, Math.floor((size - first.answer.length) / 2));
    
    if (canPlace(first.answer, startR, startC, 'across')) {
        place(first, startR, startC, 'across');
        placedWords.push(first);
    } else {
        return null; 
    }
    
    // Try to place remaining words
    for (let i = 1; i < workingList.length; i++) {
        const candidate = workingList[i];
        let placed = false;

        // Try to attach to existing words
        // We shuffle the existing words order to create variety in branching
        const shufflePlaced = [...placedWords].sort(() => 0.5 - Math.random());

        for (const existing of shufflePlaced) {
             if (placed) break;

             const existingClue = clues.find(c => c.answer === existing.answer);
             if (!existingClue) continue;

             // Find common letters
             for (let cIdx = 0; cIdx < candidate.answer.length; cIdx++) {
                 if (placed) break;
                 const char = candidate.answer[cIdx];
                 
                 for (let eIdx = 0; eIdx < existing.answer.length; eIdx++) {
                     if (existing.answer[eIdx] === char) {
                         // Proposed Intersection
                         const existingDir = existingClue.direction;
                         const newDir = existingDir === 'across' ? 'down' : 'across';

                         // Calculate proposed start pos based on intersection alignment
                         const intR = existingDir === 'across' ? existingClue.row : existingClue.row + eIdx;
                         const intC = existingDir === 'across' ? existingClue.col + eIdx : existingClue.col;

                         const proposedR = newDir === 'down' ? intR - cIdx : intR;
                         const proposedC = newDir === 'across' ? intC - cIdx : intC;

                         if (canPlace(candidate.answer, proposedR, proposedC, newDir)) {
                             place(candidate, proposedR, proposedC, newDir);
                             placedWords.push(candidate);
                             placed = true;
                             break;
                         }
                     }
                 }
             }
        }
    }

    // Renumbering logic (Standard Crossword Numbering)
    clues.forEach(c => c.number = 0); 
    let counter = 1;
    
    // Reset numbers
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (grid[r][c] === '.') continue;
            
            const startsAcross = clues.find(k => k.direction === 'across' && k.row === r && k.col === c);
            const startsDown = clues.find(k => k.direction === 'down' && k.row === r && k.col === c);

            if (startsAcross || startsDown) {
                if (startsAcross) startsAcross.number = counter;
                if (startsDown) startsDown.number = counter;
                counter++;
            }
        }
    }
    
    return {
        title: "Daily Puzzle",
        theme: "Generated",
        gridSize: size,
        grid: grid,
        clues: clues.sort((a,b) => a.number - b.number)
    };
};

export const generatePuzzle = async (topic: string, difficulty: Difficulty, region: Region): Promise<PuzzleData> => {
    const config = DIFFICULTY_CONFIG[difficulty];
    
    let words: WordItem[] = [];
    try {
        words = await fetchWordList(topic, difficulty, region);
    } catch (e) {
        throw new Error("Failed to fetch words.");
    }

    if (words.length === 0) throw new Error("Could not fetch words from AI");

    // Critical: Filter words that simply cannot fit the grid
    const fittingWords = words.filter(w => w.answer.length <= config.gridSize);
    
    // Relaxed check: We need enough words to TRY, but if we have fewer than minWords, it's risky.
    // However, if we only have 8 words for Medium (target 10), we might still want to try to place them all.
    if (fittingWords.length < 3) throw new Error("Not enough valid words for this grid size.");

    let bestPuzzle: PuzzleData | null = null;

    // Retry Strategy:
    // Attempt 0: Longest words first (Standard heuristic)
    // Attempt 1-24: Random shuffle (Brute force for variety)
    const MAX_ATTEMPTS = 25;

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        let attemptList = [...fittingWords];
        if (i === 0) {
            // Heuristic sort: Longest words first often creates better spines
            attemptList.sort((a, b) => b.answer.length - a.answer.length);
        } else {
            // Random shuffle
            attemptList.sort(() => 0.5 - Math.random());
        }

        const candidate = generateLayout(attemptList, config.gridSize);
        
        if (candidate) {
            // Score based on number of words placed
            if (!bestPuzzle || candidate.clues.length > bestPuzzle.clues.length) {
                bestPuzzle = candidate;
            }
            
            // Optimization: If we hit our target density, we stop immediately.
            if (candidate.clues.length >= config.targetWords) break;
            
            // Also stop if we managed to use almost all available words (e.g. 90%)
            if (candidate.clues.length >= Math.floor(fittingWords.length * 0.9)) break;
        }
    }
    
    // Final Validation: Did we meet the minimum word count for this difficulty?
    // We allow a small grace margin (e.g. 1 word less) to avoid frustrating failures if close.
    if (!bestPuzzle || bestPuzzle.clues.length < (config.minWords - 1)) {
        console.warn(`Failed to meet min words for ${difficulty}. Got ${bestPuzzle?.clues.length || 0}, wanted ${config.minWords}`);
        throw new Error(`Could not build a dense enough ${difficulty} grid. Try again.`);
    }

    return { ...bestPuzzle, theme: topic };
};

export const getHintForCell = async (clue: string, currentAnswerPattern: string): Promise<string> => {
    const prompt = `Clue: "${clue}". Pattern: "${currentAnswerPattern}". One short hint.`;
    try {
        const response = await ai.models.generateContent({
            model: MODEL_ID,
            contents: prompt
        });
        return response.text || "No hint available.";
    } catch (e) {
        return "Hint unavailable.";
    }
}

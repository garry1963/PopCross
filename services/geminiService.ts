import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PuzzleData, Clue, Difficulty, Region } from "../types";
import { getWordBank, saveToWordBank, WordItem } from "./storageService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Configuration
// gemini-3-flash-preview is optimized for speed and instruction following
const MODEL_ID = "gemini-3-flash-preview"; 

// Emergency backup for when API quota is hit (429) or offline
const EMERGENCY_BACKUP_WORDS: WordItem[] = [
    { answer: "NETFLIX", clue: "Streaming giant" },
    { answer: "OSCAR", clue: "Academy Award nickname" },
    { answer: "GRAMMY", clue: "Music award" },
    { answer: "EMMY", clue: "TV award" },
    { answer: "CINEMA", clue: "Movie theater" },
    { answer: "ACTOR", clue: "Performer in a film" },
    { answer: "ALBUM", clue: "Collection of songs" },
    { answer: "SONG", clue: "Musical track" },
    { answer: "DRAMA", clue: "Serious genre" },
    { answer: "COMEDY", clue: "Funny genre" },
    { answer: "STAR", clue: "Celebrity" },
    { answer: "FAME", clue: "Celebrity status" },
    { answer: "PLOT", clue: "Storyline" },
    { answer: "SCENE", clue: "Part of a movie" },
    { answer: "CAST", clue: "Group of actors" },
    { answer: "SHOW", clue: "TV program" },
    { answer: "BAND", clue: "Musical group" },
    { answer: "HIT", clue: "Popular song" },
    { answer: "FAN", clue: "Supporter" },
    { answer: "IDOL", clue: "Role model or TV show" },
    { answer: "POPCORN", clue: "Movie snack" },
    { answer: "TICKET", clue: "Admission pass" },
    { answer: "SCREEN", clue: "Movie display surface" },
    { answer: "CAMERA", clue: "Filming device" },
    { answer: "ACTION", clue: "Director's command" },
    { answer: "CUT", clue: "Stop filming" },
    { answer: "ROLE", clue: "Character played by actor" },
    { answer: "STAGE", clue: "Performance platform" },
    { answer: "AUDIO", clue: "Sound component" },
    { answer: "VIDEO", clue: "Visual component" },
    { answer: "REMIX", clue: "Altered song version" },
    { answer: "INDIE", clue: "Independent film/music" },
    { answer: "GENRE", clue: "Category of art" },
    { answer: "SCRIPT", clue: "Written dialogue" },
    { answer: "PILOT", clue: "First episode" },
    { answer: "STUDIO", clue: "Filming location" },
    { answer: "DIRECTOR", clue: "Film boss" },
    { answer: "SEQUEL", clue: "Follow-up movie" },
    { answer: "PREQUEL", clue: "Backstory movie" },
    { answer: "BLOCKBUSTER", clue: "Big hit movie" }
];

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
    
    // Check if we have enough cached words to satisfy the fetchCount
    if (cachedWords.length >= config.fetchCount) {
        console.log(`Using Cached Words for ${difficulty} (${cachedWords.length} avail)`);
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

    } catch (e: any) {
        // Detect Quota Exhaustion (429) or Network Issues
        const isQuotaError = JSON.stringify(e).includes("429") || e.message?.includes("quota") || e.status === 429;
        
        console.warn(`AI Fetch Failed (${isQuotaError ? 'Quota Exceeded' : 'Network/Other'}). Using Hybrid Fallback.`);
        
        // HYBRID FALLBACK STRATEGY:
        // Combine whatever we have in cache with the Emergency Backup words.
        // This ensures we always have a large pool of words to generate a grid,
        // preventing "Could not build valid grid" errors due to small word lists.
        const combined = [...cachedWords, ...EMERGENCY_BACKUP_WORDS];
        
        // Deduplicate by answer
        const unique = Array.from(new Map(combined.map(item => [item.answer, item])).values());
        
        // Ensure we filter by size now, to prevent issues later
        return unique.filter(w => w.answer.length <= config.gridSize);
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
            
            // Double check bounds for safety
            if (!inBounds(curR, curC)) return false;

            const char = word[i];
            const gridChar = grid[curR][curC];

            // Collision check: Cell must be empty OR match the letter
            if (gridChar !== '.' && gridChar !== char) return false;

            // Adjacency check
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

                         // Calculate proposed start pos
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

    // Renumbering logic
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
        console.error("Critical error in fetchWordList", e);
        // Fallback to emergency words if everything blows up
        words = EMERGENCY_BACKUP_WORDS;
    }

    // Fallback if empty (shouldn't happen with updated fetchWordList, but safe to keep)
    if (words.length === 0) words = EMERGENCY_BACKUP_WORDS;

    // Filter fitting words
    const fittingWords = words.filter(w => w.answer.length <= config.gridSize);
    
    // If we have very few words, default to emergency words again to ensure playability
    if (fittingWords.length < 3) {
        console.warn("Too few words from source. Augmenting with backup.");
        fittingWords.push(...EMERGENCY_BACKUP_WORDS.filter(w => w.answer.length <= config.gridSize));
    }

    let bestPuzzle: PuzzleData | null = null;
    const MAX_ATTEMPTS = 25;

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        let attemptList = [...fittingWords];
        if (i === 0) {
            // Heuristic sort
            attemptList.sort((a, b) => b.answer.length - a.answer.length);
        } else {
            // Random shuffle
            attemptList.sort(() => 0.5 - Math.random());
        }

        const candidate = generateLayout(attemptList, config.gridSize);
        
        if (candidate) {
            if (!bestPuzzle || candidate.clues.length > bestPuzzle.clues.length) {
                bestPuzzle = candidate;
            }
            if (candidate.clues.length >= config.targetWords) break;
            if (candidate.clues.length >= Math.floor(fittingWords.length * 0.9)) break;
        }
    }
    
    // Relaxed Validation
    // If we have at least 4 words, we consider it playable in failure scenarios.
    const minimalThreshold = 4;
    
    if (!bestPuzzle || bestPuzzle.clues.length < minimalThreshold) {
        // Only throw if it's truly broken (less than 4 words)
        // If we have something small (e.g. 3 words) but it's valid, we could technically play it,
        // but 4 is a reasonable minimum for a "game".
        
        console.warn(`Generation failed to create a dense grid. Best result: ${bestPuzzle?.clues.length || 0} words.`);
        throw new Error(`Unable to generate a valid grid for ${topic}. Please try again or switch topics.`);
    }
    
    // If the puzzle is sparse (below expected minWords) but above minimalThreshold,
    // we return it but might append a note to the theme.
    const isSparse = bestPuzzle.clues.length < config.minWords;

    return { 
        ...bestPuzzle, 
        theme: isSparse ? `${topic} (Lite)` : topic 
    };
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
        console.warn("Hint fetch failed (likely quota)", e);
        return "Hint unavailable (Network/Quota).";
    }
}

import { GoogleGenAI, Type } from "@google/genai";
import { PuzzleData, Direction, WordData, Region } from "../types";

// --- Types for Layout Engine ---
interface RawWord {
  word: string;
  clue: string;
}

// --- Fallback Data ---
const FALLBACK_DATA: RawWord[] = [
  { word: 'OFFICE', clue: 'Dunder Mifflin documentary' },
  { word: 'ROSS', clue: 'Paleontologist with a monkey' },
  { word: 'SEINFELD', clue: 'A show about nothing' },
  { word: 'FRIENDS', clue: 'Pivot! Pivot! Pivot!' },
  { word: 'LOST', clue: 'Plane crash on a mysterious island' },
  { word: 'ADELE', clue: 'Singer who says Hello' },
  { word: 'TITANIC', clue: 'Near, far, wherever you are movie' },
  { word: 'DUNE', clue: 'Spice planet blockbuster' },
  { word: 'BEYONCE', clue: 'Queen Bey of music' },
  { word: 'MATRIX', clue: 'Red pill or blue pill?' },
  { word: 'OFFER', clue: 'Refusal is not an option' },
  { word: 'NETFLIX', clue: 'Streaming giant' }
];

// --- Crossword Layout Engine ---

const generateLayout = (rawWords: RawWord[], theme: string, difficulty: string): PuzzleData => {
  const GRID_SIZE = 40; // Internal scratchpad size
  const MID = Math.floor(GRID_SIZE / 2);
  
  // 1. Initialize empty grid
  // grid[row][col] = char
  const grid: (string | null)[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  
  const placedWords: WordData[] = [];
  
  // 2. Sort words by length (longest first helps structure)
  const sortedWords = [...rawWords].sort((a, b) => b.word.length - a.word.length);
  
  // 3. Place first word in the middle horizontally
  if (sortedWords.length === 0) throw new Error("No words to place");
  
  const first = sortedWords[0];
  const firstRow = MID;
  const firstCol = MID - Math.floor(first.word.length / 2);
  
  // Helper to actually write to grid
  const writeToGrid = (word: string, row: number, col: number, dir: Direction) => {
    for (let i = 0; i < word.length; i++) {
      if (dir === Direction.ACROSS) grid[row][col + i] = word[i];
      else grid[row + i][col] = word[i];
    }
  };

  // Place first
  writeToGrid(first.word, firstRow, firstCol, Direction.ACROSS);
  placedWords.push({
    id: 'w-0',
    word: first.word,
    answer: first.word,
    clue: first.clue,
    startRow: firstRow,
    startCol: firstCol,
    direction: Direction.ACROSS
  });
  
  const remaining = sortedWords.slice(1);
  
  // 4. Try to place remaining words
  // Simple heuristic: Try to cross existing words
  
  for (const nextItem of remaining) {
    const word = nextItem.word;
    let placed = false;
    
    // Try to find a match with any already placed word
    // Randomize order of placed words to check to create variety
    const targets = [...placedWords].sort(() => Math.random() - 0.5);
    
    for (const target of targets) {
      if (placed) break;
      
      // Find intersection character
      for (let i = 0; i < word.length; i++) {
        if (placed) break;
        const char = word[i];
        
        for (let j = 0; j < target.word.length; j++) {
           if (target.word[j] === char) {
             // Potential intersection found
             // Target is at target.startRow/Col. 
             // Intersection absolute coords:
             const intRow = target.direction === Direction.ACROSS ? target.startRow : target.startRow + j;
             const intCol = target.direction === Direction.ACROSS ? target.startCol + j : target.startCol;
             
             // If we place 'word' perpendicular to 'target'
             const newDir = target.direction === Direction.ACROSS ? Direction.DOWN : Direction.ACROSS;
             
             // Calculate proposed start for new word
             const newStartRow = newDir === Direction.DOWN ? intRow - i : intRow;
             const newStartCol = newDir === Direction.ACROSS ? intCol - i : intCol;
             
             if (canPlace(grid, word, newStartRow, newStartCol, newDir)) {
               writeToGrid(word, newStartRow, newStartCol, newDir);
               placedWords.push({
                 id: `w-${placedWords.length}`,
                 word: word,
                 answer: word,
                 clue: nextItem.clue,
                 startRow: newStartRow,
                 startCol: newStartCol,
                 direction: newDir
               });
               placed = true;
               break;
             }
           }
        }
      }
    }
  }
  
  // 5. Crop and Normalize
  // Find bounds
  let minR = GRID_SIZE, maxR = 0, minC = GRID_SIZE, maxC = 0;
  placedWords.forEach(w => {
    minR = Math.min(minR, w.startRow);
    minC = Math.min(minC, w.startCol);
    if (w.direction === Direction.DOWN) {
      maxR = Math.max(maxR, w.startRow + w.word.length);
      maxC = Math.max(maxC, w.startCol + 1);
    } else {
      maxR = Math.max(maxR, w.startRow + 1);
      maxC = Math.max(maxC, w.startCol + w.word.length);
    }
  });
  
  const height = maxR - minR;
  const width = maxC - minC;
  
  // Normalize coordinates
  const finalWords = placedWords.map(w => ({
    ...w,
    startRow: w.startRow - minR,
    startCol: w.startCol - minC
  }));
  
  // Sort words for numbering logic (Top-left to bottom-right)
  finalWords.sort((a, b) => {
    if (a.startRow !== b.startRow) return a.startRow - b.startRow;
    return a.startCol - b.startCol;
  });

  // Re-assign IDs based on sorted position to keep things clean
  finalWords.forEach((w, i) => w.id = `word-${i}`);

  // Pad the grid slightly if it's too small (< 10)
  const finalWidth = Math.max(width, 10);
  const finalHeight = Math.max(height, 10);

  return {
    id: `puz-${Date.now()}`,
    title: `${theme} Crossword`,
    theme: theme,
    difficulty: difficulty as any,
    width: finalWidth,
    height: finalHeight,
    words: finalWords
  };
};

// Check if placement is valid
const canPlace = (
  grid: (string | null)[][], 
  word: string, 
  row: number, 
  col: number, 
  dir: Direction
): boolean => {
  const len = word.length;
  const GRID_SIZE = grid.length;

  // 1. Bounds check
  if (row < 0 || col < 0) return false;
  if (dir === Direction.ACROSS && col + len > GRID_SIZE) return false;
  if (dir === Direction.DOWN && row + len > GRID_SIZE) return false;

  // 2. Collision and adjacency check
  for (let i = 0; i < len; i++) {
    const r = dir === Direction.ACROSS ? row : row + i;
    const c = dir === Direction.ACROSS ? col + i : col;
    const char = word[i];
    const cell = grid[r][c];

    // Conflict: Cell is occupied by a different letter
    if (cell !== null && cell !== char) return false;
    
    // If cell is empty, we must ensure we aren't creating accidental adjacency
    if (cell === null) {
      // Check perpendicular neighbors
      // If placing ACROSS, check UP and DOWN neighbors
      const pPrev = dir === Direction.ACROSS ? grid[r-1]?.[c] : grid[r][c-1];
      const pNext = dir === Direction.ACROSS ? grid[r+1]?.[c] : grid[r][c+1];
      
      if (pPrev || pNext) return false; // Adjacent letter found where there shouldn't be one
    }
  }

  // 3. Check start and end boundaries (cannot touch another word immediately before/after)
  const beforeR = dir === Direction.ACROSS ? row : row - 1;
  const beforeC = dir === Direction.ACROSS ? col - 1 : col;
  if (grid[beforeR]?.[beforeC]) return false;

  const afterR = dir === Direction.ACROSS ? row : row + len;
  const afterC = dir === Direction.ACROSS ? col + len : col;
  if (grid[afterR]?.[afterC]) return false;

  return true;
};

// --- Main Service ---

export const generatePuzzle = async (category: string, difficulty: string, region: Region): Promise<PuzzleData> => {
  let apiKey: string | undefined;
  try { apiKey = process.env.API_KEY; } catch (e) {}

  // Fallback if no key
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    console.warn("Using fallback logic");
    return new Promise(resolve => setTimeout(() => {
        try {
           resolve(generateLayout(FALLBACK_DATA, category, difficulty));
        } catch (e) {
            // Even fallback might fail layout if randomness is unlucky, retry once
             resolve(generateLayout(FALLBACK_DATA, category, difficulty));
        }
    }, 800));
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Define Difficulty Parameters
    let complexityPrompt = "";
    let minLen = 3;
    let maxLen = 10;
    let numWords = 20;

    switch(difficulty) {
        case 'Easy':
            complexityPrompt = "Use EXTREMELY POPULAR, well-known mainstream answers. Simple, direct clues suitable for beginners.";
            minLen = 3;
            maxLen = 7;
            numWords = 18;
            break;
        case 'Hard':
            complexityPrompt = "Use obscure facts, deep cuts, b-sides, or slightly cryptic trivia. Answers can be longer or more complex.";
            minLen = 4;
            maxLen = 12;
            numWords = 25; // More words to increase intersection density
            break;
        default: // Medium
            complexityPrompt = "Standard trivia difficulty. A mix of famous hits and some specific knowledge.";
            minLen = 3;
            maxLen = 9;
            numWords = 20;
            break;
    }

    // Define Region Parameters
    let regionPrompt = "Include a diverse mix of US and UK pop culture.";
    if (region === 'USA') {
        regionPrompt = "Prioritize American pop culture, US TV shows, Hollywood movies, and US spelling (e.g. Color).";
    } else if (region === 'UK') {
        regionPrompt = "Prioritize British pop culture, UK TV shows (e.g. BBC, Channel 4), British bands, and UK spelling (e.g. Colour).";
    }

    // Request JUST words, not the grid. This is 10x faster.
    const prompt = `
      Generate a list of ${numWords} words and clues for a crossword puzzle about "${category}".
      Focus strictly on Pop Culture (TV, Movies, Music) related to this theme.
      ${regionPrompt}
      ${complexityPrompt}
      Words should be between ${minLen} and ${maxLen} letters long.
      Return purely JSON.
      Format: { "words": [ { "word": "ANSWER", "clue": "Hint" }, ... ] }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            words: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  clue: { type: Type.STRING }
                },
                required: ["word", "clue"]
              }
            }
          }
        }
      }
    });

    if (!response.text) throw new Error("No response");
    
    let jsonStr = response.text.trim();
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```(json)?/, '').replace(/```$/, '');
    
    const data = JSON.parse(jsonStr);
    let wordList: RawWord[] = data.words || [];

    // Filter valid words based on constraints
    wordList = wordList.filter(w => w.word && w.word.length >= 3 && /^[A-Z]+$/i.test(w.word));
    wordList = wordList.map(w => ({ ...w, word: w.word.toUpperCase() }));

    // Additional length filtering to ensure the model respected constraints
    wordList = wordList.filter(w => w.word.length <= maxLen + 1); // +1 buffer just in case

    if (wordList.length < 5) throw new Error("Not enough words generated");

    // Run local layout engine
    // We try a couple of times because the greedy algorithm outcome depends on sort/randomness
    try {
        return generateLayout(wordList, category, difficulty);
    } catch (layoutError) {
        console.warn("First layout attempt failed, retrying...");
        return generateLayout(wordList, category, difficulty);
    }

  } catch (error) {
    console.error("Gemini Error:", error);
    // Use fallback data but try to respect the requested category name in the title
    return generateLayout(FALLBACK_DATA, category, difficulty);
  }
};